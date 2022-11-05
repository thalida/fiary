<script setup lang="ts">
import { useCanvasStore } from "@/stores/canvas";
import type { TPrimaryKey } from "@/types/core";
import { computed, onMounted, ref } from "vue";

const props = defineProps<{ pageId: TPrimaryKey }>();
const canvasStore = useCanvasStore();
const sceneStore = computed(() => canvasStore.scenes[props.pageId]);
const drawingCanvas = ref<HTMLCanvasElement>();
const emits = defineEmits<{
  (event: "ready", canvas: HTMLCanvasElement): void;
}>();

onMounted(() => {
  if (typeof drawingCanvas.value === "undefined") {
    return;
  }

  console.log(drawingCanvas.value);

  const ctx = drawingCanvas.value.getContext("2d");

  if (ctx === null) {
    return;
  }

  const dpi = canvasStore.canvasConfig.dpi;
  drawingCanvas.value.width = canvasStore.canvasConfig.width * dpi;
  drawingCanvas.value.height = canvasStore.canvasConfig.height * dpi;

  drawingCanvas.value.style.width = `${canvasStore.canvasConfig.width}px`;
  drawingCanvas.value.style.height = `${canvasStore.canvasConfig.height}px`;

  ctx.scale(dpi, dpi);
  emits("ready", drawingCanvas.value);
});

function drawElements() {
  if (typeof drawingCanvas.value === "undefined") {
    return;
  }

  const ctx = drawingCanvas.value.getContext("2d");

  if (ctx === null) {
    return;
  }

  ctx.setTransform(sceneStore.value.initTransformMatrix);
  ctx.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height);
  ctx.setTransform(sceneStore.value.transformMatrix);

  const drawElementIds = sceneStore.value.activeElements;
  for (let i = 0; i < drawElementIds.length; i += 1) {
    const elementId = drawElementIds[i];
    const element = sceneStore.value.elementById(elementId);
    if (typeof element.drawElement === "undefined") {
      continue;
    }
    element.drawElement(drawingCanvas.value);
  }
}

defineExpose({
  drawElements,
});
</script>
<template>
  <canvas
    class="drawing-layer"
    ref="drawingCanvas"
    :width="canvasStore.canvasConfig.width"
    :height="canvasStore.canvasConfig.height"
  >
  </canvas>
</template>

<style scoped></style>
