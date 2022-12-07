<script setup lang="ts">
import { computed, ref } from "vue";
import Selecto from "selecto";
import Moveable from "moveable";
import type { TPrimaryKey, ICheckboxElementSettings, ITransformMatrix } from "@/types/core";
import { ELEMENT_TYPE, PageHistoryEvent } from "@/constants/core";
import type TextboxElement from "@/models/elements/TextboxElement";
import TextboxElementComponent from "@/components/TextboxElement.vue";
import CheckboxElementComponent from "@/components/CheckboxElement.vue";
import cloneDeep from "lodash/cloneDeep";
import { useCoreStore } from "@/stores/core";
import type BaseInteractiveElement from "@/models/BaseInteractiveElement";
import { merge } from "lodash";

const props = defineProps<{ pageUid: TPrimaryKey }>();
const coreStore = useCoreStore();
const pageOptions = computed(() => coreStore.pageOptions[props.pageUid]);
const rootEl = ref(null as HTMLElement | null);
const activeElementUid = ref(null as TPrimaryKey | null);
const activeHtmlElements = computed(() => {
  const activeElements = coreStore.activeElements(props.pageUid);
  return activeElements.filter(
    (uid: TPrimaryKey) => coreStore.elements[uid].isHtmlElement && !coreStore.elements[uid].isHidden
  );
});

let selectoInteractive: Selecto;
let moveableInteractive: Moveable;
let moveableElements: (HTMLElement | SVGElement)[] = [];

function handleStartInteractiveEdit() {
  if (rootEl.value === null) return;

  pageOptions.value.isInteractiveEditMode = true;
  activeElementUid.value = null;
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
    scalable: true,
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
    .on("scale", handleInteractiveScale)
    .on("scaleGroup", (e) => {
      e.events.forEach(handleInteractiveScale as any);
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
  const elementUid = target.getAttribute("data-element-uid");
  if (elementUid === null) {
    return;
  }
  const element = coreStore.elements[elementUid] as BaseInteractiveElement;
  element.transform = merge(element.transform, transform);
  coreStore.markDirtyElement(elementUid);
}

function handleInteractiveDrag({
  target,
  translate,
  ...res
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

function handleInteractiveScale({
  target,
  scale,
  drag,
}: {
  target: HTMLElement;
  scale: number[];
  drag: { translate: number[] };
}) {
  setInteractiveElementStyles(target, { scale, translate: drag.translate });
}

function handleInteractiveStart(target: HTMLElement | SVGElement) {
  const elementUid = target.getAttribute("data-element-uid");
  if (elementUid === null) {
    return;
  }

  const element = coreStore.elements[elementUid] as BaseInteractiveElement;
  element.tmpFromTransfrom = cloneDeep(element.transform);
}

function handleInteractiveEnd(target: HTMLElement | SVGElement) {
  const elementUid = target.getAttribute("data-element-uid");
  if (elementUid === null) {
    return;
  }
  const element = coreStore.elements[elementUid] as BaseInteractiveElement;
  coreStore.addHistoryEvent(props.pageUid, {
    type: PageHistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES,
    elementUid: element.uid,
    to: cloneDeep(element.transform),
    from: cloneDeep(element.tmpFromTransfrom),
  });

  element.tmpFromTransfrom = null;
}

function handleInteractiveElementDelete() {
  for (let i = 0; i < moveableElements.length; i += 1) {
    const elementUid = moveableElements[i].getAttribute("data-element-uid");
    if (elementUid === null) {
      continue;
    }
    const element = coreStore.elements[elementUid] as BaseInteractiveElement;
    coreStore.removeElement(element);
  }
  moveableElements = [];
  moveableInteractive.target = [];
}

function handleTextboxChange({
  elementUid,
  textContents,
}: {
  elementUid: TPrimaryKey;
  textContents: string;
}) {
  const element = coreStore.elements[elementUid] as TextboxElement;
  element.settings.textContents = textContents;
  coreStore.markDirtyElement(elementUid);
}

function handleCheckboxChange(elementUid: TPrimaryKey) {
  coreStore.markDirtyElement(elementUid);
}

function handleTextboxFocus({ elementUid }: { elementUid: TPrimaryKey }) {
  if (pageOptions.value.isDrawing) {
    return;
  }

  pageOptions.value.isTextboxEditMode = true;
  pageOptions.value.selectedTool = ELEMENT_TYPE.TEXTBOX;
  activeElementUid.value = elementUid;
}

function handleTextboxBlur() {
  pageOptions.value.isTextboxEditMode = false;
}

function handleInteractiveElementEvent(e: Event) {
  if (!pageOptions.value.isInteractiveEditMode && !pageOptions.value.isDrawing) {
    e.stopPropagation();
  }
}

function reset() {
  pageOptions.value.isTextboxEditMode = false;
  pageOptions.value.isInteractiveEditMode = false;
  activeElementUid.value = null;
}

defineExpose({
  reset,
  handleStartInteractiveEdit,
  handleEndInteractiveEdit,
  handleInteractiveElementDelete,
});
</script>

<template>
  <div
    v-if="pageOptions"
    ref="rootEl"
    :style="{
      width: coreStore.canvasConfig.width + 'px',
      height: coreStore.canvasConfig.height + 'px',
      transform: `matrix(1, 0, 0, 1, 0, 0)`,
    }"
  >
    <template v-for="elementUid in activeHtmlElements" :key="elementUid">
      <CheckboxElementComponent
        v-if="coreStore.elements[elementUid].tool === ELEMENT_TYPE.CHECKBOX"
        class="interactiveElement"
        :data-element-uid="elementUid"
        :style="{
          position: 'absolute',
          transform: (coreStore.elements[elementUid] as BaseInteractiveElement).getTransformCSS(),
        }"
        :elementUid="elementUid"
        @change="handleCheckboxChange"
        @mousedown="handleInteractiveElementEvent"
        @touchstart="handleInteractiveElementEvent"
        @mouseup="handleInteractiveElementEvent"
        @touchend="handleInteractiveElementEvent"
        @mousemove="handleInteractiveElementEvent"
        @touchmove="handleInteractiveElementEvent"
      />
      <TextboxElementComponent
        v-else-if="coreStore.elements[elementUid].tool === ELEMENT_TYPE.TEXTBOX"
        :data-element-uid="elementUid"
        class="interactiveElement"
        :style="{
          position: 'absolute',
          transform: (coreStore.elements[elementUid] as BaseInteractiveElement).getTransformCSS(),
        }"
        :elementUid="elementUid"
        :is-active="elementUid === activeElementUid"
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
