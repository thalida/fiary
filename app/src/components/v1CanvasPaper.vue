<script setup lang="ts">
import { computed, ref } from "vue";
import { useCoreStore } from "@/stores/core";
import { getColorAsCss } from "@/utils/color";
import * as dotPattern from "@/components/CanvasPatterns/dot";
import * as squarePattern from "@/components/CanvasPatterns/square";
import * as linesPattern from "@/components/CanvasPatterns/lines";
import * as isoPattern from "@/components/CanvasPatterns/iso";
import { PatternStyles } from "@/constants/core";

const coreStore = useCoreStore();
const props = defineProps<{
  pageId: string;
}>();

const patternMap: { [key: number]: any } = {
  [PatternStyles.DOTS]: dotPattern,
  [PatternStyles.SQUARES]: squarePattern,
  [PatternStyles.LINES]: linesPattern,
  [PatternStyles.ISOMETRIC]: isoPattern,
};
const page = computed(() => coreStore.pages[props.pageId]);
const selectedPattern = computed(() =>
  page.value && page.value.patternStyle ? patternMap[page.value.patternStyle] : null
);
</script>
<template>
  <div class="canvas-paper" v-if="page">
    <div class="paper-color" :style="{ background: page.bgColor }"></div>
    <svg class="paper-pattern" width="100%" height="100%">
      <component
        id="paper-svg-pattern"
        :is="selectedPattern.COMPONENT"
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
        :opacity="selectedPatternOpacity / 100"
      ></rect>
    </svg>
  </div>
</template>

<style scoped></style>
