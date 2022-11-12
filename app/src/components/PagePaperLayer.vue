<script setup lang="ts">
import { computed, ref } from "vue";
import type { TPrimaryKey } from "@/types/core";
import { getColorAsCss } from "@/utils/color";
import { useCanvasStore } from "@/stores/canvas";
import { useCoreStore } from "@/stores/core";
import { PATTERN_TYPES } from "@/constants/core";
import patterns from "@/components/PagePatterns";

const props = defineProps<{ pageUid: TPrimaryKey }>();
const coreStore = useCoreStore();
const canvasStore = useCanvasStore();

const page = computed(() => coreStore.pages[props.pageUid]);
const pageOptions = computed(() => canvasStore.pageOptions[props.pageUid]);
const paperPatternTransform = ref({ x: 0, y: 0, lineSize: 0, spacing: 0 });

const selectedPatternComponent = computed(() => {
  return page.value.patternType !== PATTERN_TYPES.SOLID ? patterns[page.value.patternType] : null;
});
const paperColor = computed(() =>
  coreStore.getSwatchColor(page.value.paperPaletteUid, page.value.paperSwatchUid)
);
const patternColor = computed(() =>
  coreStore.getSwatchColor(page.value.patternPaletteUid, page.value.patternSwatchUid)
);

function setPaperTransforms() {
  let relativeZoom = 1;

  if (
    typeof pageOptions.value.transformMatrix !== "undefined" &&
    pageOptions.value.transformMatrix !== null
  ) {
    const initMatrixA = pageOptions.value.initTransformMatrix
      ? pageOptions.value.initTransformMatrix.a
      : 1;
    relativeZoom = initMatrixA / pageOptions.value.transformMatrix.a;
    paperPatternTransform.value.x = pageOptions.value.transformMatrix.e / initMatrixA;
    paperPatternTransform.value.y = pageOptions.value.transformMatrix.f / initMatrixA;
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
  <div v-if="pageOptions" class="paper-layer">
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
