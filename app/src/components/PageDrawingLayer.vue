<script setup lang="ts">
import { useCanvasStore } from "@/stores/canvas";
import { onMounted, ref } from "vue";
const canvasStore = useCanvasStore();
const drawingLayer = ref<HTMLCanvasElement>();
const emits = defineEmits<{
  (event: "ready", canvas: HTMLCanvasElement): void;
}>();

onMounted(() => {
  if (typeof drawingLayer.value === "undefined") {
    return;
  }

  console.log(drawingLayer.value);

  const ctx = drawingLayer.value.getContext("2d");

  if (ctx === null) {
    return;
  }

  const dpi = canvasStore.canvasConfig.dpi;
  drawingLayer.value.width = canvasStore.canvasConfig.width * dpi;
  drawingLayer.value.height = canvasStore.canvasConfig.height * dpi;

  drawingLayer.value.style.width = `${canvasStore.canvasConfig.width}px`;
  drawingLayer.value.style.height = `${canvasStore.canvasConfig.height}px`;

  ctx.scale(dpi, dpi);
  emits("ready", drawingLayer.value);
});
</script>
<template>
  <canvas
    class="drawing-layer"
    ref="drawingLayer"
    :width="canvasStore.canvasConfig.width"
    :height="canvasStore.canvasConfig.height"
  >
  </canvas>
</template>

<style scoped></style>
