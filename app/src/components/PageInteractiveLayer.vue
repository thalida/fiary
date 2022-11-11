<script setup lang="ts">
import { computed, ref } from "vue";
import Selecto from "selecto";
import Moveable from "moveable";
import { useCanvasStore } from "@/stores/canvas";
import type { TPrimaryKey, ICheckboxElementOptions, ITextboxElementOptions } from "@/types/core";
import { ELEMENT_TYPE, PageHistoryEvent } from "@/constants/core";
import PageTextarea from "@/components/PageTextarea.vue";
import cloneDeep from "lodash/cloneDeep";

const props = defineProps<{ pageId: TPrimaryKey }>();
const canvasStore = useCanvasStore();
const pageOptions = computed(() => canvasStore.pageOptions[props.pageId]);
const rootEl = ref(null as HTMLElement | null);
const activeElementId = ref(null as TPrimaryKey | null);
const activeHtmlElements = computed(() => {
  const activeElements = canvasStore.activeElements(props.pageId);
  return activeElements.filter(
    (id: TPrimaryKey) =>
      pageOptions.value.elements[id].isHTMLElement && !pageOptions.value.elements[id].isDeleted
  );
});

let selectoInteractive: Selecto;
let moveableInteractive: Moveable;
let moveableElements: (HTMLElement | SVGElement)[] = [];

function handleStartInteractiveEdit() {
  if (rootEl.value === null) return;

  pageOptions.value.isInteractiveEditMode = true;
  activeElementId.value = null;
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
      e.events.forEach(handleInteractiveDrag as any);
    })
    .on("rotate", handleInteractiveRotate)
    .on("rotateGroup", (e) => {
      e.events.forEach(handleInteractiveRotate as any);
    })
    .on("renderEnd", ({ target }: { target: HTMLElement }) => {
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
  pageOptions.value.isInteractiveEditMode = false;
  selectoInteractive.destroy();
  moveableInteractive.destroy();
}

function setInteractiveElementStyles(
  target: HTMLElement,
  transform: { [key: string]: number | number[] }
) {
  const elementId = target.getAttribute("data-element-id");
  if (elementId === null) {
    return;
  }
  const element = canvasStore.elementById(props.pageId, elementId);
  element.setTransform(
    pageOptions.value.initTransformMatrix,
    pageOptions.value.transformMatrix,
    transform
  );
  target.style.transform = element.style.transformStr;
}

function handleInteractiveDrag({
  target,
  translate,
}: {
  target: HTMLElement;
  translate: number[];
}) {
  setInteractiveElementStyles(target, { translate });
}

function handleInteractiveRotate({
  target,
  rotate,
  drag,
}: {
  target: HTMLElement;
  rotate: number;
  drag: { translate: number[] };
}) {
  setInteractiveElementStyles(target, { rotate, translate: drag.translate });
}

function handleInteractiveStart(target: HTMLElement | SVGElement) {
  const elementId = target.getAttribute("data-element-id");
  if (elementId === null) {
    return;
  }

  const element = canvasStore.elementById(props.pageId, elementId);
  element.tmpFromStyle = cloneDeep(element.style);
}

function handleInteractiveEnd(target: HTMLElement | SVGElement) {
  const elementId = target.getAttribute("data-element-id");
  if (elementId === null) {
    return;
  }
  const element = canvasStore.elementById(props.pageId, elementId);
  canvasStore.addHistoryEvent(props.pageId, {
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
    if (elementId === null) {
      continue;
    }
    canvasStore.deleteElement(props.pageId, elementId);
  }
  moveableElements = [];
  moveableInteractive.target = [];
}

function handleTextboxChange({
  elementId,
  textContents,
}: {
  elementId: TPrimaryKey;
  textContents: string;
}) {
  const element = canvasStore.elementById(props.pageId, elementId);
  (element.toolOptions as ITextboxElementOptions).textContents = textContents;
}

function handleTextboxFocus({ elementId }: { elementId: TPrimaryKey }) {
  if (pageOptions.value.isDrawing) {
    return;
  }

  pageOptions.value.isTextboxEditMode = true;
  pageOptions.value.selectedTool = ELEMENT_TYPE.TEXTBOX;
  activeElementId.value = elementId;
}

function handleTextboxBlur() {
  pageOptions.value.isTextboxEditMode = false;
}

function handleInteractiveElementEvent(e: Event) {
  if (!pageOptions.value.isInteractiveEditMode && !pageOptions.value.isDrawing) {
    e.stopPropagation();
  }
}

function setInteractiveElementTransforms() {
  for (let i = 0; i < activeHtmlElements.value.length; i += 1) {
    const elementId = activeHtmlElements.value[i];
    const element = pageOptions.value.elements[elementId];
    element.setTransform(pageOptions.value.initTransformMatrix, pageOptions.value.transformMatrix);
  }
}

function reset() {
  pageOptions.value.isTextboxEditMode = false;
  pageOptions.value.isInteractiveEditMode = false;
  activeElementId.value = null;
}

defineExpose({
  reset,
  handleStartInteractiveEdit,
  handleEndInteractiveEdit,
  handleInteractiveElementDelete,
  setInteractiveElementTransforms,
});
</script>

<template>
  <div
    v-if="pageOptions"
    ref="rootEl"
    :style="{
      width: canvasStore.canvasConfig.width + 'px',
      height: canvasStore.canvasConfig.height + 'px',
      transform: `matrix(1, 0, 0, 1, 0, 0)`,
    }"
  >
    <template v-for="elementId in activeHtmlElements" :key="elementId">
      <input
        v-if="pageOptions.elements[elementId].tool === ELEMENT_TYPE.CHECKBOX"
        class="interactiveElement"
        v-model="(pageOptions.elements[elementId].toolOptions as ICheckboxElementOptions).isChecked"
        :data-element-id="pageOptions.elements[elementId].id"
        type="checkbox"
        :style="{
          position: 'absolute',
          transform: pageOptions.elements[elementId].style.transformStr,
        }"
        @mousedown="handleInteractiveElementEvent"
        @touchstart="handleInteractiveElementEvent"
        @mouseup="handleInteractiveElementEvent"
        @touchend="handleInteractiveElementEvent"
        @mousemove="handleInteractiveElementEvent"
        @touchmove="handleInteractiveElementEvent"
      />
      <PageTextarea
        v-else-if="pageOptions.elements[elementId].tool === ELEMENT_TYPE.TEXTBOX"
        :data-element-id="pageOptions.elements[elementId].id"
        class="interactiveElement"
        :style="{
          position: 'absolute',
          transform: pageOptions.elements[elementId].style.transformStr,
        }"
        :element="pageOptions.elements[elementId]"
        :is-active="pageOptions.elements[elementId].id === activeElementId"
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
