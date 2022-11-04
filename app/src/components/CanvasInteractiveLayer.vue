<script setup lang="ts">
import { computed, ref } from "vue";
import Selecto from "selecto";
import Moveable from "moveable";
import { useCanvasStore } from "@/stores/canvas";
import type { TPrimaryKey, ICheckboxElementOptions, ITextboxElementOptions } from "@/types/core";
import { CanvasTool, PageHistoryEvent } from "@/constants/core";
import CanvasTextarea from "@/components/CanvasTextarea.vue";
import cloneDeep from "lodash/cloneDeep";

const props = defineProps<{ pageId: TPrimaryKey }>();
const canvasStore = useCanvasStore();
const sceneStore = computed(() => canvasStore.scenes[props.pageId]);
const rootEl = ref(null as HTMLElement | null);

let selectoInteractive, moveableInteractive;
let moveableElements: any[] = [];

function handleStartInteractiveEdit() {
  if (rootEl.value === null) return;

  sceneStore.value.isInteractiveEditMode = true;
  sceneStore.value.activeElementId = null;
  moveableElements = [];
  selectoInteractive = new Selecto({
    container: rootEl.value,
    selectableTargets: [".interactiveElement"],
    selectByClick: true,
    selectFromInside: false,
    continueSelect: false,
    toggleContinueSelect: "shift",
    hitRate: 0,
  });

  moveableInteractive = new Moveable(rootEl.value, {
    draggable: true,
    rotatable: true,
    pinchable: true,
  });

  moveableInteractive
    .on("renderStart", ({ target }) => {
      handleInteractiveStart(target);
    })
    .on("renderGroupStart", (e) => {
      e.targets.forEach(handleInteractiveStart);
    })
    .on("clickGroup", (e) => {
      selectoInteractive.clickTarget(e.inputEvent, e.inputTarget);
    })
    .on("drag", handleInteractiveDrag)
    .on("dragGroup", (e) => {
      e.events.forEach(handleInteractiveDrag);
    })
    .on("rotate", handleInteractiveRotate)
    .on("rotateGroup", (e) => {
      e.events.forEach(handleInteractiveRotate);
    })
    .on("renderEnd", ({ target }) => {
      handleInteractiveEnd(target);
    })
    .on("renderGroupEnd", (e) => {
      e.targets.forEach(handleInteractiveEnd);
    });

  selectoInteractive
    .on("dragStart", (e) => {
      const target = e.inputEvent.target;
      if (
        moveableInteractive.isMoveableElement(target) ||
        moveableElements.some((t) => t === target || t.contains(target))
      ) {
        e.stop();
      }
    })
    .on("select", (e) => {
      moveableElements = e.selected;
      moveableInteractive.target = moveableElements;
    })
    .on("selectEnd", (e) => {
      if (e.isDragStart) {
        e.inputEvent.preventDefault();

        setTimeout(() => {
          moveableInteractive.dragStart(e.inputEvent);
        });
      }
    });
}

function handleEndInteractiveEdit() {
  sceneStore.value.isInteractiveEditMode = false;
  selectoInteractive.destroy();
  moveableInteractive.destroy();
}

function setInteractiveElementStyles(target, transform) {
  const elementId = target.getAttribute("data-element-id");
  const element = sceneStore.value.elementById(elementId);
  element.setTransform(
    sceneStore.value.initTransformMatrix,
    sceneStore.value.transformMatrix,
    transform
  );
  target.style.transform = element.style.transformStr;
}

function handleInteractiveDrag({ target, translate }) {
  setInteractiveElementStyles(target, { translate });
}

function handleInteractiveRotate({ target, rotate, drag }) {
  setInteractiveElementStyles(target, { rotate, translate: drag.translate });
}

function handleInteractiveStart(target) {
  const elementId = target.getAttribute("data-element-id");
  const element = sceneStore.value.elementById(elementId);
  element.tmpFromStyle = cloneDeep(element.style);
}

function handleInteractiveEnd(target) {
  const elementId = target.getAttribute("data-element-id");
  const element = sceneStore.value.elementById(elementId);
  sceneStore.value.addHistoryEvent({
    type: PageHistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES,
    elementId: element.id,
    to: cloneDeep(element.style),
    from: cloneDeep(element.tmpFromStyle),
  });

  delete element.tmpFromStyle;
}

function handleInteractiveElementDelete() {
  for (let i = 0; i < moveableElements.length; i += 1) {
    const elementId = moveableElements[i].getAttribute("data-element-id");
    sceneStore.value.deleteElement(elementId);
  }
  moveableElements = [];
  moveableInteractive.target = [];
}

function handleTextboxChange({ elementId, textContents }) {
  const element = sceneStore.value.elementById(elementId);
  (element.toolOptions as ITextboxElementOptions).textContents = textContents;
}

function handleTextboxFocus({ elementId }) {
  if (sceneStore.value.isDrawing) {
    return;
  }

  sceneStore.value.isTextboxEditMode = true;
  sceneStore.value.selectedTool = CanvasTool.TEXTBOX;
  sceneStore.value.activeElementId = elementId;
}

function handleTextboxBlur() {
  sceneStore.value.isTextboxEditMode = false;
}

function handleInteractiveElementEvent(e: Event) {
  if (!sceneStore.value.isInteractiveEditMode && !sceneStore.value.isDrawing) {
    e.stopPropagation();
  }
}

defineExpose({
  handleStartInteractiveEdit,
  handleEndInteractiveEdit,
  handleInteractiveElementDelete,
});
</script>

<template>
  <div
    v-if="sceneStore"
    ref="rootEl"
    :style="{
      width: canvasStore.canvasConfig.width + 'px',
      height: canvasStore.canvasConfig.height + 'px',
      transform: `matrix(1, 0, 0, 1, 0, 0)`,
    }"
  >
    <template v-for="elementId in sceneStore.activeHtmlElements" :key="elementId">
      <input
        v-if="sceneStore.elements[elementId].tool === CanvasTool.CHECKBOX"
        class="interactiveElement"
        v-model="(sceneStore.elements[elementId].toolOptions as ICheckboxElementOptions).isChecked"
        :data-element-id="sceneStore.elements[elementId].id"
        type="checkbox"
        :style="{
          position: 'absolute',
          transform: sceneStore.elements[elementId].style.transformStr,
        }"
        @mousedown="handleInteractiveElementEvent"
        @touchstart="handleInteractiveElementEvent"
        @mouseup="handleInteractiveElementEvent"
        @touchend="handleInteractiveElementEvent"
        @mousemove="handleInteractiveElementEvent"
        @touchmove="handleInteractiveElementEvent"
      />
      <CanvasTextarea
        v-else-if="sceneStore.elements[elementId].tool === CanvasTool.TEXTBOX"
        :data-element-id="sceneStore.elements[elementId].id"
        class="interactiveElement"
        :style="{
          position: 'absolute',
          transform: sceneStore.elements[elementId].style.transformStr,
        }"
        :element="sceneStore.elements[elementId]"
        :is-active="sceneStore.elements[elementId].id === sceneStore.activeElementId"
        :colorSwatches="canvasStore.swatches"
        @change="handleTextboxChange"
        @focus="handleTextboxFocus"
        @blur="handleTextboxBlur"
        @mousedown="handleInteractiveElementEvent"
        @touchstart="handleInteractiveElementEvent"
        @mouseup="handleInteractiveElementEvent"
        @touchend="handleInteractiveElementEvent"
        @mousemove="handleInteractiveElementEvent"
        @touchmove="handleInteractiveElementEvent"
      />
    </template>
  </div>
</template>

<style scoped></style>
