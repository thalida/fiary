import { defineStore } from "pinia";
import { computed, reactive, ref, type UnwrapNestedRefs } from "vue";
import type { IPageOptions, TPrimaryKey } from "@/types/core";
import PageScene from "@/models/PageScene";
import { PALETTE_TYPES, TRANSPARENT_COLOR } from "@/constants/core";
import { useCoreStore } from "./core";

export const useCanvasStore = defineStore("canvas", () => {
  const coreStore = useCoreStore();
  const pageOptions = ref({} as { [key: TPrimaryKey]: IPageOptions });
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
  const isSwatchOpen = ref(false);

  const scenes = reactive({} as { [key: TPrimaryKey]: UnwrapNestedRefs<PageScene> });
  function setupSceneStore(
    pageId: TPrimaryKey,
    matrix: { a: number; b: number; c: number; d: number; e: number; f: number }
  ) {
    scenes[pageId] = new PageScene(pageId, matrix) as unknown as UnwrapNestedRefs<PageScene>;
  }

  const selectedFillColor = computed(() => (pageId: TPrimaryKey) => {
    const options = pageOptions.value[pageId];
    if (options.fillPaletteId === null || options.fillSwatchId === null) {
      return TRANSPARENT_COLOR;
    }
    return coreStore.getSwatchColor(options.fillPaletteId, options.fillSwatchId);
  });

  const selectedStrokeColor = computed(() => (pageId: TPrimaryKey) => {
    const options = pageOptions.value[pageId];
    if (options.strokeSwatchId === null || options.strokePaletteId === null) {
      return TRANSPARENT_COLOR;
    }
    return coreStore.getSwatchColor(options.strokePaletteId, options.strokeSwatchId);
  });

  function initPageOptions(pageId: TPrimaryKey) {
    if (typeof pageOptions.value[pageId] === "undefined") {
      const options = {
        fillPaletteId: coreStore.builtinPalettes[PALETTE_TYPES.TOOL_FILL]?.palette,
        fillSwatchId: coreStore.builtinPalettes[PALETTE_TYPES.TOOL_FILL]?.swatch,
        strokePaletteId: coreStore.builtinPalettes[PALETTE_TYPES.TOOL_STROKE]?.palette,
        strokeSwatchId: coreStore.builtinPalettes[PALETTE_TYPES.TOOL_STROKE]?.swatch,
      };
      pageOptions.value[pageId] = options;
    }

    return pageOptions.value[pageId];
  }

  // const updatedPage = pages.value[page.pk];
  // if (typeof updatedPage.fillColor === "undefined" || updatedPage.fillColor === null) {
  //   const fillColor = getSwatchColor.value(DEFAULT_SWATCH_KEY, DEFAULT_ELEMENT_FILLCOLOR_INDEX);
  //   pages.value[page.pk].fillColor = fillColor;
  // }

  // if (typeof updatedPage.strokeColor === "undefined" || updatedPage.strokeColor === null) {
  //   const strokeColor = getSwatchColor.value(
  //     SPECIAL_TOOL_SWATCH_KEY,
  //     DEFAULT_ELEMENT_STROKECOLOR_INDEX
  //   );
  //   pages.value[page.pk].strokeColor = strokeColor;
  // }

  return {
    scenes,
    setupSceneStore,
    canvasConfig,
    canvasDiagSize,
    isSwatchOpen,
    pageOptions,
    initPageOptions,
    selectedFillColor,
    selectedStrokeColor,
  };
});
