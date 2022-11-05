<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { cloneDeep } from "lodash";
import Moveable from "moveable";
import { useCanvasStore } from "@/stores/canvas";
import type { TPrimaryKey } from "@/types/core";
import { clearCanvas } from "@/utils/canvas";
import { ELEMENT_TYPE } from "@/constants/core";
import { ELEMENT_MAP } from "@/models/elements";

const props = defineProps<{ pageId: TPrimaryKey }>();
const canvasStore = useCanvasStore();
const sceneStore = computed(() => canvasStore.scenes[props.pageId]);
const rootEl = ref<HTMLElement>();
const canvas = ref<HTMLCanvasElement>();
let moveableEl: any = null;
const emit = defineEmits<{
  (event: "redraw"): void;
}>();

async function handlePasteStart() {
  sceneStore.value.pasteTransform = {
    translate: [0, 0],
    scale: [1, 1],
    rotate: 0,
  };
  sceneStore.value.isPasteMode = true;
  await nextTick();

  if (typeof rootEl.value === "undefined" || typeof canvas.value === "undefined") {
    sceneStore.value.isPasteMode = false;
    return;
  }

  const ctx = canvas.value.getContext("2d");

  if (ctx === null) {
    return;
  }

  const cutSelectionId =
    sceneStore.value.activeElements[sceneStore.value.activeElements.length - 1];
  const cutSelection = sceneStore.value.elementById(cutSelectionId);

  if (!cutSelection.isDrawingCached) {
    cutSelection.isCompletedCut = true;
    cutSelection.composition = "destination-out";
    cutSelection.cacheElement();
  }

  emit("redraw");

  sceneStore.value.pasteTransform.translate = [
    cutSelection.cache.drawing.x,
    cutSelection.cache.drawing.y,
  ];
  setPasteTransform(canvas.value, sceneStore.value.pasteTransform);

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
  for (let i = 0; i < sceneStore.value.activeElements.length - 1; i += 1) {
    const elementId = sceneStore.value.activeElements[i];
    const element = sceneStore.value.elementById(elementId);
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
  const cutSelectionId =
    sceneStore.value.activeElements[sceneStore.value.activeElements.length - 1];
  sceneStore.value.deleteElement(cutSelectionId, false);
  sceneStore.value.isPasteMode = false;
}

function handlePasteEnd() {
  if (typeof canvas.value === "undefined") {
    return;
  }

  const cutSelectionId =
    sceneStore.value.activeElements[sceneStore.value.activeElements.length - 1];
  const cutSelection = sceneStore.value.elementById(cutSelectionId);
  const moveableRect = moveableEl.getRect();
  const pasteElement = new ELEMENT_MAP[ELEMENT_TYPE.PASTE](moveableRect);

  if (
    sceneStore.value.pasteTransform.rotate === 0 &&
    cutSelection.cache.drawing.x === pasteElement.dimensions.outerMinX &&
    cutSelection.cache.drawing.y === pasteElement.dimensions.outerMinY &&
    cutSelection.cache.drawing.width === pasteElement.dimensions.outerWidth &&
    cutSelection.cache.drawing.height === pasteElement.dimensions.outerHeight
  ) {
    handleCancelPaste();
    emit("redraw");
    sceneStore.value.popHistoryEvent();
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
  const rotRad = (sceneStore.value.pasteTransform.rotate * Math.PI) / 180;

  const imageWidth = sceneStore.value.pasteTransform.scale[0] * canvas.value.offsetWidth;
  const imageHeight = sceneStore.value.pasteTransform.scale[1] * canvas.value.offsetHeight;

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

  sceneStore.value.createElement(pasteElement);
  emit("redraw");
  sceneStore.value.isPasteMode = false;
}

function handlePasteDelete() {
  emit("redraw");
  sceneStore.value.isPasteMode = false;
}

function setPasteTransform(
  target: HTMLElement,
  transform: { translate?: number[]; scale?: number[]; rotate?: number }
) {
  const nextTransform = {
    ...sceneStore.value.pasteTransform,
    ...transform,
  };

  const translate = `translate(${nextTransform.translate[0]}px, ${nextTransform.translate[1]}px)`;
  const scale = `scale(${nextTransform.scale[0]}, ${nextTransform.scale[1]})`;
  const rotate = `rotate(${nextTransform.rotate}deg)`;
  target.style.transform = `${translate} ${scale} ${rotate}`;

  sceneStore.value.pasteTransform = nextTransform;
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
  <div ref="rootEl" class="paste-layer" v-if="sceneStore && sceneStore.isPasteMode">
    <canvas class="paste-canvas" ref="canvas"></canvas>
  </div>
</template>

<style scoped></style>
