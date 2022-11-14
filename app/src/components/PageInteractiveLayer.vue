<script setup lang="ts">
import { computed, ref } from "vue";
import Selecto from "selecto";
import Moveable from "moveable";
import { useCanvasStore } from "@/stores/canvas";
import type { TPrimaryKey, ICheckboxElementSettings, ITextboxElementSettings } from "@/types/core";
import { ELEMENT_TYPE, PageHistoryEvent } from "@/constants/core";
import PageTextarea from "@/components/PageTextarea.vue";
import cloneDeep from "lodash/cloneDeep";
import { useCoreStore } from "@/stores/core";
import type BaseInteractiveElement from "@/models/BaseInteractiveElement";
import type TextboxElement from "@/models/elements/TextboxElement";

const props = defineProps<{ pageUid: TPrimaryKey }>();
const coreStore = useCoreStore();
const canvasStore = useCanvasStore();
const pageOptions = computed(() => canvasStore.pageOptions[props.pageUid]);
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
  const elementUid = target.getAttribute("data-element-uid");
  if (elementUid === null) {
    return;
  }
  const element = coreStore.elements[elementUid] as BaseInteractiveElement;
  element.setTransform(pageOptions.value.transformMatrix, transform);
  target.style.transform = element.transformStr ? element.transformStr : "";
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
    coreStore.deleteElement(elementUid);
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

function setInteractiveElementTransforms() {
  for (let i = 0; i < activeHtmlElements.value.length; i += 1) {
    const elementUid = activeHtmlElements.value[i];
    const element = coreStore.elements[elementUid] as BaseInteractiveElement;
    element.setTransform(pageOptions.value.initTransformMatrix, pageOptions.value.transformMatrix);
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
    <template v-for="elementUid in activeHtmlElements" :key="elementUid">
      <input
        v-if="coreStore.elements[elementUid].tool === ELEMENT_TYPE.CHECKBOX"
        class="interactiveElement"
        v-model="(coreStore.elements[elementUid].settings as ICheckboxElementSettings).isChecked"
        :data-element-uid="coreStore.elements[elementUid].uid"
        type="checkbox"
        :style="{
          position: 'absolute',
          transform: (coreStore.elements[elementUid].transformStr as any)
        }"
        @mousedown="handleInteractiveElementEvent"
        @touchstart="handleInteractiveElementEvent"
        @mouseup="handleInteractiveElementEvent"
        @touchend="handleInteractiveElementEvent"
        @mousemove="handleInteractiveElementEvent"
        @touchmove="handleInteractiveElementEvent"
      />
      <PageTextarea
        v-else-if="coreStore.elements[elementUid].tool === ELEMENT_TYPE.TEXTBOX"
        :data-element-uid="coreStore.elements[elementUid].uid"
        class="interactiveElement"
        :style="{
          position: 'absolute',
          transform: coreStore.elements[elementUid].transformStr,
        }"
        :element="coreStore.elements[elementUid]"
        :is-active="coreStore.elements[elementUid].uid === activeElementUid"
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
