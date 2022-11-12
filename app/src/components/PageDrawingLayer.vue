<script setup lang="ts">
import { useCanvasStore } from "@/stores/canvas";
import type { TPrimaryKey } from "@/types/core";
import { computed, onMounted, ref } from "vue";

const props = defineProps<{ pageUid: TPrimaryKey }>();
const canvasStore = useCanvasStore();
const pageOptions = computed(() => canvasStore.pageOptions[props.pageUid]);
const drawingCanvas = ref<HTMLCanvasElement>();
const emits = defineEmits<{
  (event: "ready", canvas: HTMLCanvasElement): void;
}>();

onMounted(() => {
  if (typeof drawingCanvas.value === "undefined") {
    return;
  }

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

  ctx.setTransform(pageOptions.value.initTransformMatrix);
  ctx.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height);
  ctx.setTransform(pageOptions.value.transformMatrix);

  const drawElementUids = canvasStore.activeElements(props.pageUid);
  for (let i = 0; i < drawElementUids.length; i += 1) {
    const elementUid = drawElementUids[i];
    const element = canvasStore.elementByUid(props.pageUid, elementUid);
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
