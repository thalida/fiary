<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { cloneDeep } from "lodash";
import Moveable from "moveable";
import { useCanvasStore } from "@/stores/canvas";
import type { TPrimaryKey } from "@/types/core";
import { clearCanvas } from "@/utils/canvas";
import { ELEMENT_TYPE } from "@/constants/core";
import { ELEMENT_MAP } from "@/models/elements";

const props = defineProps<{ pageUid: TPrimaryKey }>();
const canvasStore = useCanvasStore();
const pageOptions = computed(() => canvasStore.pageOptions[props.pageUid]);
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

  let activeElements = canvasStore.activeElements(props.pageUid);
  const cutSelectionUid = activeElements[activeElements.length - 1];
  const cutSelection = canvasStore.elementByUid(props.pageUid, cutSelectionUid);

  if (!cutSelection.isDrawingCached) {
    cutSelection.isCompletedCut = true;
    cutSelection.composition = "destination-out";
    cutSelection.cacheElement();
  }

  emit("redraw");

  pasteTransform.value.translate = [cutSelection.cache.drawing.x, cutSelection.cache.drawing.y];
  setPasteTransform(canvas.value, pasteTransform.value);

  const dpi = cutSelection.cache.drawing.dpi;
  const width = cutSelection.cache.drawing.width;
  const height = cutSelection.cache.drawing.height;

  canvas.value.width = width * dpi;
  canvas.value.height = height * dpi;

  canvas.value.style.width = `${width}px`;
  canvas.value.style.height = `${height}px`;
  ctx.scale(dpi, dpi);

  clearCanvas(canvas.value);
  ctx.translate(-cutSelection.cache.drawing.x, -cutSelection.cache.drawing.y);
  activeElements = canvasStore.activeElements(props.pageUid);
  for (let i = 0; i < activeElements.length - 1; i += 1) {
    const elementUid = activeElements[i];
    const element = canvasStore.elementByUid(props.pageUid, elementUid);
    element.drawElement(canvas.value);
  }
  const cutSelectionClip = cloneDeep(cutSelection);
  cutSelectionClip.isDrawingCached = false;
  cutSelectionClip.cache = {};
  cutSelectionClip.composition = "destination-in";
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
  const activeElements = canvasStore.activeElements(props.pageUid);
  const cutSelectionUid = activeElements[activeElements.length - 1];
  canvasStore.deleteElement(props.pageUid, cutSelectionUid, false);
  pageOptions.value.isPasteMode = false;
}

function handlePasteEnd() {
  if (typeof canvas.value === "undefined") {
    return;
  }

  const activeElements = canvasStore.activeElements(props.pageUid);
  const cutSelectionUid = activeElements[activeElements.length - 1];
  const cutSelection = canvasStore.elementByUid(props.pageUid, cutSelectionUid);
  const moveableRect = moveableEl.getRect();
  const pasteElement = new ELEMENT_MAP[ELEMENT_TYPE.PASTE](moveableRect);

  if (
    pasteTransform.value.rotate === 0 &&
    cutSelection.cache.drawing.x === pasteElement.dimensions.outerMinX &&
    cutSelection.cache.drawing.y === pasteElement.dimensions.outerMinY &&
    cutSelection.cache.drawing.width === pasteElement.dimensions.outerWidth &&
    cutSelection.cache.drawing.height === pasteElement.dimensions.outerHeight
  ) {
    handleCancelPaste();
    emit("redraw");
    canvasStore.popHistoryEvent(props.pageUid);
    return;
  }

  const pasteCacheCanvas = document.createElement("canvas");
  const ctx = pasteCacheCanvas.getContext("2d");

  if (ctx === null) {
    return;
  }

  const dpi = window.devicePixelRatio;
  const minX = pasteElement.dimensions.outerMinX;
  const minY = pasteElement.dimensions.outerMinY;
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

  pasteElement.isDrawingCached = true;
  pasteElement.cache.drawing = {
    x: minX,
    y: minY,
    width,
    height,
    dpi,
    canvas: pasteCacheCanvas,
  };

  canvasStore.createElement(props.pageUid, pasteElement);
  emit("redraw");
  pageOptions.value.isPasteMode = false;
}

function handlePasteDelete() {
  emit("redraw");
  pageOptions.value.isPasteMode = false;
}

function setPasteTransform(
  target: HTMLElement,
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

function onPasteDrag({ target, translate }: { target: HTMLElement; translate: number[] }) {
  setPasteTransform(target, { translate });
}

function onPasteRotate({
  target,
  rotate,
  drag,
}: {
  target: HTMLElement;
  rotate: number;
  drag: { translate: number[] };
}) {
  setPasteTransform(target, { rotate, translate: drag.translate });
}

function onPasteScale({
  target,
  scale,
  drag,
}: {
  target: HTMLElement;
  scale: number[];
  drag: { translate: number[] };
}) {
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
