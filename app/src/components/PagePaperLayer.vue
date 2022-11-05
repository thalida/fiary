<script setup lang="ts">
import { computed, ref } from "vue";
import { useCanvasStore } from "@/stores/canvas";
import type { TPrimaryKey } from "@/types/core";
import { getColorAsCss } from "@/utils/color";

const props = defineProps<{ pageId: TPrimaryKey }>();
const canvasStore = useCanvasStore();
const sceneStore = computed(() => canvasStore.scenes[props.pageId]);
const paperPatternTransform = ref({ x: 0, y: 0, lineSize: 0, spacing: 0 });

const selectedPaperColor = computed(() => {
  return canvasStore.getSwatchColor(
    sceneStore.value.selectedPaperSwatchId,
    sceneStore.value.selectedPaperColorIdx
  );
});
const selectedPatternComponent = computed(() => {
  return canvasStore.getPaperPatternComponentByIdx(sceneStore.value.selectedPaperPatternIdx);
});
const selectedPatternStyles = computed(() => {
  return canvasStore.getPaperPatternPropsByIdx(sceneStore.value.selectedPaperPatternIdx);
});
const selectedPatternColor = computed(() => {
  return canvasStore.getSwatchColor(
    sceneStore.value.selectedPatternSwatchId,
    sceneStore.value.selectedPatternColorIdx
  );
});

function setPaperTransforms(
  matrix:
    | { a: number; b: number; c: number; d: number; e: number; f: number }
    | null
    | undefined = null
) {
  let relativeZoom = 1;

  if (typeof matrix !== "undefined" && matrix !== null) {
    const initMatrixA = sceneStore.value.initTransformMatrix
      ? sceneStore.value.initTransformMatrix.a
      : 1;
    relativeZoom = initMatrixA / matrix.a;
    paperPatternTransform.value.x = matrix.e / initMatrixA;
    paperPatternTransform.value.y = matrix.f / initMatrixA;
  }

  paperPatternTransform.value.lineSize = selectedPatternStyles.value.lineSize / relativeZoom;
  paperPatternTransform.value.spacing = selectedPatternStyles.value.spacing / relativeZoom;
}

defineExpose({
  setPaperTransforms,
});
</script>
<template>
  <div v-if="sceneStore" class="paper-layer">
    <div class="paper-color" :style="{ background: getColorAsCss(selectedPaperColor) }"></div>
    <svg class="paper-pattern" width="100%" height="100%">
      <component
        id="paper-svg-pattern"
        :is="selectedPatternComponent.COMPONENT"
        :fillColor="getColorAsCss(selectedPatternColor)"
        :lineSize="paperPatternTransform.lineSize"
        :spacing="paperPatternTransform.spacing"
        :x="paperPatternTransform.x"
        :y="paperPatternTransform.y"
      />
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#paper-svg-pattern)"
        :opacity="sceneStore.selectedPatternOpacity / 100"
      ></rect>
    </svg>
  </div>
</template>

<style scoped>
.paper-layer .paper-color {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
