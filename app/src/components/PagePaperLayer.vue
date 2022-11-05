<script setup lang="ts">
import { computed } from "vue";
import { useCanvasStore } from "@/stores/canvas";
import type { TPrimaryKey } from "@/types/core";
import { getColorAsCss } from "@/utils/color";

const props = defineProps<{ pageId: TPrimaryKey }>();
const canvasStore = useCanvasStore();
const sceneStore = computed(() => canvasStore.scenes[props.pageId]);

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

function setPaperTransforms(matrix: DOMMatrix | null | undefined = null) {
  let relativeZoom = 1;

  if (typeof matrix !== "undefined" && matrix !== null) {
    const initMatrixA = sceneStore.value.initTransformMatrix
      ? sceneStore.value.initTransformMatrix.a
      : 1;
    relativeZoom = initMatrixA / matrix.a;
    sceneStore.value.paperPatternTransform.x = matrix.e / initMatrixA;
    sceneStore.value.paperPatternTransform.y = matrix.f / initMatrixA;
  }

  sceneStore.value.paperPatternTransform.lineSize =
    selectedPatternStyles.value.lineSize / relativeZoom;
  sceneStore.value.paperPatternTransform.spacing =
    selectedPatternStyles.value.spacing / relativeZoom;
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
        :lineSize="sceneStore.paperPatternTransform.lineSize"
        :spacing="sceneStore.paperPatternTransform.spacing"
        :x="sceneStore.paperPatternTransform.x"
        :y="sceneStore.paperPatternTransform.y"
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
