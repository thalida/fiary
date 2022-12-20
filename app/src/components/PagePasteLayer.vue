<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { cloneDeep } from "lodash";
import Moveable, { type OnDrag, type OnRotate, type OnScale } from "moveable";
import type { ICanvasSettings, TPrimaryKey } from "@/types/core";
import { clearCanvas } from "@/utils/canvas";
import { ELEMENT_TYPE, TRANSPARENT_COLOR } from "@/constants/core";
import { ELEMENT_MAP } from "@/models/elements";
import { useCoreStore } from "@/stores/core";
import type CutElement from "@/models/elements/CutElement";
import type BaseCanvasElement from "@/models/BaseCanvasElement";

const props = defineProps<{ pageUid: TPrimaryKey }>();
const coreStore = useCoreStore();
const page = computed(() => coreStore.pages[props.pageUid]);
const pageOptions = computed(() => coreStore.pageOptions[props.pageUid]);
const rootEl = ref<HTMLElement>();
const canvas = ref<HTMLCanvasElement>();
const pasteTransform = ref({
  translate: [0, 0],
  scale: [1, 1],
  rotate: 0,
});
let moveableEl: any = null;
const emit = defineEmits<{
  (event: "redraw"): void;
}>();

async function handlePasteStart() {
  pasteTransform.value = {
    translate: [0, 0],
    scale: [1, 1],
    rotate: 0,
  };
  pageOptions.value.isPasteMode = true;
  await nextTick();

  if (typeof rootEl.value === "undefined" || typeof canvas.value === "undefined") {
    pageOptions.value.isPasteMode = false;
    return;
  }

  const ctx = canvas.value.getContext("2d");

  if (ctx === null) {
    return;
  }

  let activeElements = coreStore.activeElements(props.pageUid);
  const cutSelectionUid = activeElements[activeElements.length - 1];
  const cutSelection = coreStore.elements[cutSelectionUid] as CutElement;

  if (!cutSelection.isCached) {
    cutSelection.settings.isCompletedCut = true;
    cutSelection.canvasSettings.composition = "destination-out";
    cutSelection.cacheElement();
  }

  emit("redraw");

  const dpi = cutSelection.canvasSettings.dpi;
  const minX = cutSelection.dimensions.outerMinX;
  const minY = cutSelection.dimensions.outerMinY;
  const width = cutSelection.dimensions.outerWidth;
  const height = cutSelection.dimensions.outerHeight;

  pasteTransform.value.translate = [minX, minY];
  setPasteTransform(canvas.value, pasteTransform.value);

  canvas.value.width = width * dpi;
  canvas.value.height = height * dpi;

  canvas.value.style.width = `${width}px`;
  canvas.value.style.height = `${height}px`;
  ctx.scale(dpi, dpi);

  clearCanvas(canvas.value);
  ctx.translate(-minX, -minY);

  if (typeof page.value.canvasImage !== "undefined" && page.value.canvasImage !== null) {
    ctx.drawImage(
      page.value.canvasImage,
      0,
      0,
      coreStore.canvasConfig.width,
      coreStore.canvasConfig.width
    );
  }

  activeElements = coreStore.activeElements(props.pageUid);
  for (let i = 0; i < activeElements.length - 1; i += 1) {
    const elementUid = activeElements[i];
    const element = coreStore.elements[elementUid] as BaseCanvasElement;
    if (typeof element.drawElement === "undefined") {
      continue;
    }
    element.drawElement(canvas.value);
  }
  const cutSelectionClip = cloneDeep(cutSelection);
  cutSelectionClip.isCached = false;
  cutSelectionClip.canvasDataUrl = null;
  cutSelectionClip.cachedCanvasImage = null;
  cutSelectionClip.canvasSettings.composition = "destination-in";
  cutSelectionClip.drawElement(canvas.value);

  moveableEl = new Moveable(rootEl.value, {
    target: canvas.value as HTMLElement,
    draggable: true,
    rotatable: true,
    pinchable: true,
    scalable: true,
    keepRatio: true,
  });

  moveableEl.on("drag", onPasteDrag).on("rotate", onPasteRotate).on("scale", onPasteScale);
}

function handleCancelPaste() {
  const activeElements = coreStore.activeElements(props.pageUid);
  const cutSelectionUid = activeElements[activeElements.length - 1];
  const cutSelection = coreStore.elements[cutSelectionUid] as CutElement;
  coreStore.removeElement(cutSelection, false);
  pageOptions.value.isPasteMode = false;
}

function handlePasteEnd() {
  if (typeof canvas.value === "undefined") {
    return;
  }

  const activeElements = coreStore.activeElements(props.pageUid);
  const cutSelectionUid = activeElements[activeElements.length - 1];
  const cutSelection = coreStore.elements[cutSelectionUid] as CutElement;
  const moveableRect = moveableEl.getRect();
  const pasteElement = new ELEMENT_MAP[ELEMENT_TYPE.PASTE]({
    pageUid: props.pageUid,
    tool: ELEMENT_TYPE.PASTE,
    settings: {
      cutRect: moveableRect,
    },
    canvasSettings: {
      strokeColor: TRANSPARENT_COLOR,
      fillColor: { r: 255, g: 255, b: 255, a: 1 },
    } as ICanvasSettings,
  });

  if (
    pasteTransform.value.rotate === 0 &&
    cutSelection.dimensions.outerMinX === pasteElement.dimensions.outerMinX &&
    cutSelection.dimensions.outerMinY === pasteElement.dimensions.outerMinY &&
    cutSelection.dimensions.outerWidth === pasteElement.dimensions.outerWidth &&
    cutSelection.dimensions.outerHeight === pasteElement.dimensions.outerHeight
  ) {
    handleCancelPaste();
    emit("redraw");
    coreStore.popHistoryEvent(props.pageUid);
    return;
  }

  const pasteCacheCanvas = document.createElement("canvas");
  const ctx = pasteCacheCanvas.getContext("2d");

  if (ctx === null) {
    return;
  }

  const dpi = window.devicePixelRatio;
  const width = pasteElement.dimensions.outerWidth;
  const height = pasteElement.dimensions.outerHeight;
  const rotRad = (pasteTransform.value.rotate * Math.PI) / 180;

  const imageWidth = pasteTransform.value.scale[0] * canvas.value.offsetWidth;
  const imageHeight = pasteTransform.value.scale[1] * canvas.value.offsetHeight;

  pasteCacheCanvas.width = width * dpi;
  pasteCacheCanvas.height = height * dpi;
  pasteCacheCanvas.style.width = `${width}px`;
  pasteCacheCanvas.style.height = `${height}px`;

  const centerX = width / 2;
  const centerY = height / 2;

  ctx.save();
  ctx.scale(dpi, dpi);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotRad);
  ctx.drawImage(canvas.value, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
  ctx.restore();

  pasteElement.isCached = true;
  pasteElement.canvasDataUrl = pasteCacheCanvas.toDataURL();
  const img = new Image();
  img.onload = () => {
    pasteElement.cachedCanvasImage = img;
    coreStore.addElement(pasteElement);
    emit("redraw");
    pageOptions.value.isPasteMode = false;
  };
  img.src = pasteElement.canvasDataUrl;
}

function handlePasteDelete() {
  emit("redraw");
  pageOptions.value.isPasteMode = false;
}

function setPasteTransform(
  target: HTMLElement | SVGElement,
  transform: { translate?: number[]; scale?: number[]; rotate?: number }
) {
  const nextTransform = {
    ...pasteTransform.value,
    ...transform,
  };

  const translate = `translate(${nextTransform.translate[0]}px, ${nextTransform.translate[1]}px)`;
  const scale = `scale(${nextTransform.scale[0]}, ${nextTransform.scale[1]})`;
  const rotate = `rotate(${nextTransform.rotate}deg)`;
  target.style.transform = `${translate} ${scale} ${rotate}`;

  pasteTransform.value = nextTransform;
}

function onPasteDrag({ target, translate }: OnDrag) {
  setPasteTransform(target, { translate });
}

function onPasteRotate({ target, rotation, drag }: OnRotate) {
  setPasteTransform(target, { rotate: rotation, translate: drag.translate });
}

function onPasteScale({ target, scale, drag }: OnScale) {
  setPasteTransform(target, { scale, translate: drag.translate });
}

defineExpose({
  canvas,
  handlePasteStart,
  handlePasteEnd,
  handlePasteDelete,
  handleCancelPaste,
});
</script>
<template>
  <div ref="rootEl" class="paste-layer" v-if="pageOptions && pageOptions.isPasteMode">
    <canvas class="paste-canvas" ref="canvas"></canvas>
  </div>
</template>

<style scoped></style>
