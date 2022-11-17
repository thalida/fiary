<script setup lang="ts">
import { Context } from "svgcanvas";
import type BaseCanvasElement from "@/models/BaseCanvasElement";
import { useCoreStore } from "@/stores/core";
import type { TPrimaryKey } from "@/types/core";
import { computed, onMounted, ref } from "vue";

const props = defineProps<{ pageUid: TPrimaryKey }>();
const coreStore = useCoreStore();
const pageOptions = computed(() => coreStore.pageOptions[props.pageUid]);
const svgCanvas = ref<SVGElement | null>(null);
const emits = defineEmits<{
  (event: "ready", canvas: HTMLCanvasElement): void;
}>();
const ctx = new Context({
  width: coreStore.canvasConfig.width,
  height: coreStore.canvasConfig.height,
});

onMounted(() => {
  emits("ready", ctx);
});

function drawElements() {
  ctx.__clearCanvas();
  ctx.__defs.innerHTML = "";

  const drawElementUids = coreStore.activeElements(props.pageUid);
  for (let i = 0; i < drawElementUids.length; i += 1) {
    const elementUid = drawElementUids[i];
    const element = coreStore.elements[elementUid] as BaseCanvasElement;
    if (typeof element.drawElement === "undefined") {
      continue;
    }
    element.drawElement(ctx);
  }

  svgCanvas.value = ctx.getSerializedSvg();
}

defineExpose({
  drawElements,
});
</script>
<template>
  <div v-html="svgCanvas"></div>
</template>

<style scoped></style>
