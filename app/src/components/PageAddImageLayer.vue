<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import Moveable from "moveable";
import { useCanvasStore } from "@/stores/canvas";
import type { TPrimaryKey } from "@/types/core";
import { clearCanvas } from "@/utils/canvas";
import { ELEMENT_TYPE, PageHistoryEvent } from "@/constants/core";
import { ELEMENT_MAP } from "@/models/elements";

const props = defineProps<{ pageId: TPrimaryKey }>();
const canvasStore = useCanvasStore();
const sceneStore = computed(() => canvasStore.scenes[props.pageId]);
const rootEl = ref<HTMLElement>();
const activeImage = ref<HTMLImageElement | null>(null);
const imagePreviewCanvas = ref<HTMLCanvasElement>();
const imageBackdropCanvas = ref<HTMLCanvasElement>();
let moveableEl: any = null;
const emit = defineEmits<{
  (event: "redraw"): void;
}>();

const imageTransform = ref({
  translate: [0, 0],
  scale: [1, 1],
  rotate: 0,
  clipType: "inset",
  clipStyles: [0, 0, 0, 0],
});

async function handleAddImageStart(image: HTMLImageElement, trackHistory = true) {
  let imageWidth = image.width;
  let imageHeight = image.height;
  let scale = 1;
  if (
    image.width > canvasStore.canvasConfig.width ||
    image.height > canvasStore.canvasConfig.height
  ) {
    scale = Math.min(
      canvasStore.canvasConfig.width / image.width,
      canvasStore.canvasConfig.height / image.height
    );
    imageWidth *= scale;
    imageHeight *= scale;
  }

  imageTransform.value = {
    translate: [
      canvasStore.canvasConfig.width / 2 - imageWidth / 2,
      canvasStore.canvasConfig.height / 2 - imageHeight / 2,
    ],
    scale: [scale, scale],
    rotate: 0,
    clipType: "inset",
    clipStyles: [0, 0, 0, 0],
  };
  sceneStore.value.isAddImageMode = true;
  await nextTick();

  if (
    typeof rootEl.value === "undefined" ||
    typeof imagePreviewCanvas.value === "undefined" ||
    typeof imageBackdropCanvas.value === "undefined"
  ) {
    return;
  }

  const previewCtx = imagePreviewCanvas.value.getContext("2d");
  const backdropCtx = imageBackdropCanvas.value.getContext("2d");

  if (previewCtx === null || backdropCtx === null) {
    return;
  }

  setImageStyles(imagePreviewCanvas.value, imageTransform.value);

  const dpi = canvasStore.canvasConfig.dpi;
  imagePreviewCanvas.value.width = imageWidth * dpi;
  imagePreviewCanvas.value.height = imageHeight * dpi;
  imagePreviewCanvas.value.style.width = `${imageWidth}px`;
  imagePreviewCanvas.value.style.height = `${imageHeight}px`;
  previewCtx.scale(dpi, dpi);

  imageBackdropCanvas.value.width = imageWidth * dpi;
  imageBackdropCanvas.value.height = imageHeight * dpi;
  imageBackdropCanvas.value.style.width = `${imageWidth}px`;
  imageBackdropCanvas.value.style.height = `${imageHeight}px`;
  backdropCtx.scale(dpi, dpi);

  clearCanvas(imagePreviewCanvas.value);
  previewCtx.drawImage(image, 0, 0, imageWidth, imageHeight);

  clearCanvas(imageBackdropCanvas.value);
  backdropCtx.drawImage(image, 0, 0, imageWidth, imageHeight);

  activeImage.value = image;

  moveableEl = new Moveable(rootEl.value, {
    target: imagePreviewCanvas.value as HTMLElement,
    draggable: true,
    rotatable: true,
    pinchable: true,
    scalable: true,
    clippable: true,
    clipTargetBounds: true,
    keepRatio: true,
  });
  moveableEl
    .on("drag", onImageDrag)
    .on("rotate", onImageRotate)
    .on("scale", onImageScale)
    .on("clip", onImageClip);

  if (trackHistory) {
    sceneStore.value.addHistoryEvent({
      type: PageHistoryEvent.ADD_IMAGE_START,
      image,
    });
  }
}

function handleAddImageEnd() {
  if (typeof imagePreviewCanvas.value === "undefined" || activeImage.value === null) {
    return;
  }

  const moveableRect = moveableEl.getRect();
  const imageElement = new ELEMENT_MAP[ELEMENT_TYPE.IMAGE](activeImage.value, moveableRect);

  const imageCacheCanvas = document.createElement("canvas");
  const ctx = imageCacheCanvas.getContext("2d");

  if (ctx === null) {
    return;
  }

  const dpi = canvasStore.canvasConfig.dpi;
  const minX = imageElement.dimensions.outerMinX;
  const minY = imageElement.dimensions.outerMinY;
  const width = imageElement.dimensions.outerWidth;
  const height = imageElement.dimensions.outerHeight;
  const centerX = width / 2;
  const centerY = height / 2;

  imageCacheCanvas.width = width * dpi;
  imageCacheCanvas.height = height * dpi;
  imageCacheCanvas.style.width = `${width}px`;
  imageCacheCanvas.style.height = `${height}px`;

  const rotRad = (imageTransform.value.rotate * Math.PI) / 180;
  const imageWidth = imageTransform.value.scale[0] * imagePreviewCanvas.value.offsetWidth;
  const imageHeight = imageTransform.value.scale[1] * imagePreviewCanvas.value.offsetHeight;
  const clipValues = imageTransform.value.clipStyles
    .map((value: number | string) =>
      typeof value === "string" ? Number(value.split("px")[0]) : value
    )
    .map((value: number) => (value < 0 ? 0 : value));
  clipValues[0] *= imageTransform.value.scale[1];
  clipValues[1] *= imageTransform.value.scale[0];
  clipValues[2] *= imageTransform.value.scale[1];
  clipValues[3] *= imageTransform.value.scale[0];
  const clipWidth = imageWidth - clipValues[1] - clipValues[3];
  const clipHeight = imageHeight - clipValues[0] - clipValues[2];

  ctx.save();
  ctx.scale(dpi, dpi);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotRad);
  ctx.beginPath();
  ctx.rect(
    -imageWidth / 2 + clipValues[3],
    -imageHeight / 2 + clipValues[0],
    clipWidth,
    clipHeight
  );
  ctx.clip();
  ctx.fillStyle = "#ff0000";
  ctx.fill();
  ctx.drawImage(
    imagePreviewCanvas.value,
    -imageWidth / 2,
    -imageHeight / 2,
    imageWidth,
    imageHeight
  );
  ctx.restore();

  imageElement.isDrawingCached = true;
  imageElement.cache.drawing = {
    x: minX,
    y: minY,
    width,
    height,
    dpi,
    canvas: imageCacheCanvas,
  };

  sceneStore.value.createElement(imageElement);
  emit("redraw");
  activeImage.value = null;
  sceneStore.value.isAddImageMode = false;
}

function handleCancelAddImage() {
  sceneStore.value.isAddImageMode = false;
}

function handleImageUpload(e: Event) {
  const target = e.target as HTMLInputElement;

  if (target === null || target.files === null || target.files.length === 0) {
    return;
  }
  const file = target.files[0];

  const reader = new FileReader();
  reader.onload = function (onloadEvent) {
    if (onloadEvent.target === null || typeof onloadEvent.target.result !== "string") {
      return;
    }

    const img = new Image();
    img.onload = function () {
      handleAddImageStart(img);
    };

    img.src = onloadEvent.target.result;

    target.value = "";
  };

  reader.readAsDataURL(file);
}

function setImageStyles(
  target: HTMLElement,
  transform: {
    translate?: number[];
    scale?: number[];
    rotate?: number;
    clipType?: string;
    clipStyles?: number[];
  }
) {
  if (typeof imagePreviewCanvas.value === "undefined") {
    return;
  }
  const nextTransform = {
    ...imageTransform.value,
    ...transform,
  };

  const translate = `translate(${nextTransform.translate[0]}px, ${nextTransform.translate[1]}px)`;
  const scale = `scale(${nextTransform.scale[0]}, ${nextTransform.scale[1]})`;
  const rotate = `rotate(${nextTransform.rotate}deg)`;

  imagePreviewCanvas.value.style.transform = `${translate} ${scale} ${rotate}`;
  imagePreviewCanvas.value.style.clipPath = `${
    nextTransform.clipType
  }(${nextTransform.clipStyles.join(" ")})`;

  if (typeof imageBackdropCanvas.value !== "undefined") {
    imageBackdropCanvas.value.style.transform = `${translate} ${scale} ${rotate}`;
  }

  imageTransform.value = nextTransform;
}

function onImageDrag({ target, translate }: { target: HTMLElement; translate: number[] }) {
  setImageStyles(target, { translate });
}

function onImageRotate({
  target,
  rotate,
  drag,
}: {
  target: HTMLElement;
  rotate: number;
  drag: { translate: number[] };
}) {
  setImageStyles(target, { rotate, translate: drag.translate });
}

function onImageScale({
  target,
  scale,
  drag,
}: {
  target: HTMLElement;
  scale: number[];
  drag: { translate: number[] };
}) {
  setImageStyles(target, { scale, translate: drag.translate });
}

function onImageClip({
  target,
  clipType,
  clipStyles,
}: {
  target: HTMLElement;
  clipType: string;
  clipStyles: number[];
}) {
  setImageStyles(target, { clipType, clipStyles });
}

defineExpose({
  handleAddImageStart,
  handleAddImageEnd,
  handleCancelAddImage,
  handleImageUpload,
});
</script>
<template>
  <div v-if="sceneStore && sceneStore.isAddImageMode" ref="rootEl" class="image-layer">
    <div class="image-canvases">
      <canvas class="image-canvas image-canvas--preview" ref="imagePreviewCanvas"></canvas>
      <canvas class="image-canvas image-canvas--backdrop" ref="imageBackdropCanvas"></canvas>
    </div>
  </div>
</template>

<style scoped>
.image-layer .image-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.image-layer .image-canvas--preview {
  z-index: 1;
}

.image-layer .image-canvas--backdrop {
  z-index: 0;
  opacity: 0.5;
}
</style>
<style>
.image-layer .moveable-control-box .moveable-control.moveable-direction.moveable-nw,
.image-layer .moveable-control-box .moveable-control.moveable-direction.moveable-ne,
.image-layer .moveable-control-box .moveable-control.moveable-direction.moveable-sw,
.image-layer .moveable-control-box .moveable-control.moveable-direction.moveable-se {
  z-index: 20;
}
</style>
