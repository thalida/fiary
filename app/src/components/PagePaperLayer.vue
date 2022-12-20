<script setup lang="ts">
import { computed, ref } from "vue";
import type { TPrimaryKey } from "@/types/core";
import { getColorAsCss } from "@/utils/color";
import { useCoreStore } from "@/stores/core";
import { PATTERN_TYPES } from "@/constants/core";
import patterns from "@/components/PagePatterns";

const props = defineProps<{ pageUid: TPrimaryKey }>();
const coreStore = useCoreStore();

const page = computed(() => coreStore.pages[props.pageUid]);
const pageOptions = computed(() => coreStore.pageOptions[props.pageUid]);

const selectedPatternComponent = computed(() => {
  return page.value.patternType !== PATTERN_TYPES.SOLID ? patterns[page.value.patternType] : null;
});
const paperColor = computed(() =>
  coreStore.getSwatchColor(page.value.paperPaletteUid, page.value.paperSwatchUid)
);
const patternColor = computed(() =>
  coreStore.getSwatchColor(page.value.patternPaletteUid, page.value.patternSwatchUid)
);
</script>
<template>
  <div v-if="pageOptions" class="paper-layer">
    <div class="paper-color" :style="{ background: getColorAsCss(paperColor) }"></div>
    <svg class="paper-pattern" width="100%" height="100%" v-if="selectedPatternComponent !== null">
      <component
        id="paper-svg-pattern"
        :is="selectedPatternComponent.COMPONENT"
        :fillColor="getColorAsCss(patternColor)"
        :lineSize="page.patternSize"
        :spacing="page.patternSpacing"
        x="0"
        y="0"
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
