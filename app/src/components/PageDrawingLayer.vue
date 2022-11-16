<script setup lang="ts">
import type BaseCanvasElement from "@/models/BaseCanvasElement";
import { useCoreStore } from "@/stores/core";
import type { TPrimaryKey } from "@/types/core";
import { computed, onMounted, ref } from "vue";

const props = defineProps<{ pageUid: TPrimaryKey }>();
const coreStore = useCoreStore();
const pageOptions = computed(() => coreStore.pageOptions[props.pageUid]);
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

  const dpi = coreStore.canvasConfig.dpi;
  drawingCanvas.value.width = coreStore.canvasConfig.width * dpi;
  drawingCanvas.value.height = coreStore.canvasConfig.height * dpi;

  drawingCanvas.value.style.width = `${coreStore.canvasConfig.width}px`;
  drawingCanvas.value.style.height = `${coreStore.canvasConfig.height}px`;

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

  const drawElementUids = coreStore.activeElements(props.pageUid);
  for (let i = 0; i < drawElementUids.length; i += 1) {
    const elementUid = drawElementUids[i];
    const element = coreStore.elements[elementUid] as BaseCanvasElement;
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
    :width="coreStore.canvasConfig.width"
    :height="coreStore.canvasConfig.height"
  >
  </canvas>
</template>

<style scoped></style>
