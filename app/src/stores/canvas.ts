import { defineStore } from "pinia";
import { computed, reactive, ref, type UnwrapNestedRefs } from "vue";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_COLOR_SWATCHES, DEFAULT_SWATCH_KEY, MAX_SWATCH_COLORS } from "@/constants/core";
import type { TColor, TPrimaryKey } from "@/types/core";
import { randomInteger } from "@/utils/math";
import patternComponents, { defaultPatternProps } from "@/components/CanvasPatterns";
import { CanvasScene } from "@/models/CanvasScene";

export const useCanvasStore = defineStore("canvas", () => {
  const canvasConfig = ref({
    width: window.innerWidth,
    height: window.innerHeight,
    dpi: window.devicePixelRatio,
  });
  const canvasDiagSize = computed(() => {
    return Math.sqrt(
      canvasConfig.value.width * canvasConfig.value.width +
        canvasConfig.value.height * canvasConfig.value.height
    );
  });

  const scenes = reactive({} as { [key: TPrimaryKey]: UnwrapNestedRefs<CanvasScene> });
  function setupSceneStore(pageId: TPrimaryKey) {
    scenes[pageId] = new CanvasScene(
      pageId,
      canvasDiagSize.value
    ) as unknown as UnwrapNestedRefs<CanvasScene>;
  }

  const paperPatterns = ref(patternComponents);
  const patternStyles = ref(defaultPatternProps);
  const getPaperPatternComponentByIdx = computed(() => (idx: number) => paperPatterns.value[idx]);
  const getPaperPatternPropsByIdx = computed(() => (idx: number) => patternStyles.value[idx]);

  const isSwatchOpen = ref(false);
  const swatches = ref(DEFAULT_COLOR_SWATCHES);
  const swatchOrder = ref([DEFAULT_SWATCH_KEY]);
  const getSwatchColor = computed(() => (key: string, idx: number) => swatches.value[key][idx]);
  function createSwatch() {
    const swatchId = uuidv4();
    const colors = [];

    for (let i = 0; i < MAX_SWATCH_COLORS; i += 1) {
      const color = {
        r: randomInteger(0, 255),
        g: randomInteger(0, 255),
        b: randomInteger(0, 255),
        a: 1,
      };
      colors.push(color);
    }
    swatches.value[swatchId] = colors;
    swatchOrder.value.push(swatchId);
  }
  function updateSwatchColor(swatchId: string, colorIdx: number, color: TColor) {
    swatches.value[swatchId][colorIdx] = color;
  }

  return {
    scenes,
    setupSceneStore,
    canvasConfig,
    paperPatterns,
    getPaperPatternComponentByIdx,
    getPaperPatternPropsByIdx,
    isSwatchOpen,
    swatches,
    swatchOrder,
    getSwatchColor,
    createSwatch,
    updateSwatchColor,
  };
});
