<script setup lang="ts">
import { computed, ref } from "vue";
import type { TPrimaryKey } from "@/types/core";
import { getColorAsCss } from "@/utils/color";
import { useCanvasStore } from "@/stores/canvas";
import { useCoreStore } from "@/stores/core";
import { PATTERN_TYPES } from "@/constants/core";
import patterns from "@/components/PagePatterns";

const props = defineProps<{ pageId: TPrimaryKey }>();
const coreStore = useCoreStore();
const canvasStore = useCanvasStore();

const page = computed(() => coreStore.pages[props.pageId]);
const sceneStore = computed(() => canvasStore.scenes[props.pageId]);
const paperPatternTransform = ref({ x: 0, y: 0, lineSize: 0, spacing: 0 });

const selectedPatternComponent = computed(() => {
  return page.value.patternType !== PATTERN_TYPES.SOLID ? patterns[page.value.patternType] : null;
});
const paperColor = computed(() =>
  coreStore.getSwatchColor(page.value.paperPalette, page.value.paperSwatch)
);
const patternColor = computed(() =>
  coreStore.getSwatchColor(page.value.patternPalette, page.value.patternSwatch)
);

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

  paperPatternTransform.value.lineSize = page.value.patternSize
    ? page.value.patternSize / relativeZoom
    : 0;
  paperPatternTransform.value.spacing = page.value.patternSpacing
    ? page.value.patternSpacing / relativeZoom
    : 0;
}

defineExpose({
  setPaperTransforms,
});
</script>
<template>
  <div v-if="sceneStore" class="paper-layer">
    <div class="paper-color" :style="{ background: getColorAsCss(paperColor) }"></div>
    <svg class="paper-pattern" width="100%" height="100%" v-if="selectedPatternComponent !== null">
      <component
        id="paper-svg-pattern"
        :is="selectedPatternComponent.COMPONENT"
        :fillColor="getColorAsCss(patternColor)"
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
        :opacity="page.patternOpacity / 100"
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
