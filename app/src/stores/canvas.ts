import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { IPageOptions, ITransformMatrix, TPrimaryKey } from "@/types/core";
import {
  DEFAULT_PEN_SIZE,
  ELEMENT_TYPE,
  LineEndSide,
  LineEndStyle,
  PALETTE_TYPES,
  TRANSPARENT_COLOR,
} from "@/constants/core";
import { useCoreStore } from "./core";
import { clone } from "lodash";

export const useCanvasStore = defineStore("canvas", () => {
  const coreStore = useCoreStore();
  const pageOptions = ref({} as { [key: TPrimaryKey]: IPageOptions });
  const canvasConfig = ref({
    width: window.innerWidth,
    height: window.innerHeight,
    dpi: window.devicePixelRatio,
  });

  const selectedFillColor = computed(() => (pageUid: TPrimaryKey) => {
    const options = pageOptions.value[pageUid];
    if (options.fillPaletteUid === null || options.fillSwatchUid === null) {
      return TRANSPARENT_COLOR;
    }
    return coreStore.getSwatchColor(options.fillPaletteUid, options.fillSwatchUid);
  });

  const selectedStrokeColor = computed(() => (pageUid: TPrimaryKey) => {
    const options = pageOptions.value[pageUid];
    if (options.strokeSwatchUid === null || options.strokePaletteUid === null) {
      return TRANSPARENT_COLOR;
    }
    return coreStore.getSwatchColor(options.strokePaletteUid, options.strokeSwatchUid);
  });

  function initPageOptions(pageUid: TPrimaryKey, matrix: ITransformMatrix) {
    if (typeof pageOptions.value[pageUid] === "undefined") {
      const matrixAsObj = {
        a: matrix.a,
        b: matrix.b,
        c: matrix.c,
        d: matrix.d,
        e: matrix.e,
        f: matrix.f,
      };
      const options = {
        fillPaletteUid: coreStore.builtinPalettes[PALETTE_TYPES.TOOL_FILL]?.palette,
        fillSwatchUid: coreStore.builtinPalettes[PALETTE_TYPES.TOOL_FILL]?.swatch,
        strokePaletteUid: coreStore.builtinPalettes[PALETTE_TYPES.TOOL_STROKE]?.palette,
        strokeSwatchUid: coreStore.builtinPalettes[PALETTE_TYPES.TOOL_STROKE]?.swatch,

        selectedTool: ELEMENT_TYPE.PEN,
        selectedToolSize: DEFAULT_PEN_SIZE,
        selectedLineEndSide: LineEndSide.NONE,
        selectedLineEndStyle: LineEndStyle.NONE,

        isDebugMode: false,
        isPasteMode: false,
        isAddImageMode: false,
        isInteractiveEditMode: false,
        isTextboxEditMode: false,
        isRulerMode: false,
        isPanning: false,
        isMovingRuler: false,
        isDrawing: false,
        isSwatchOpen: false,
        isStylus: false,
        detectedStylus: false,
        allowFingerDrawing: true,

        initTransformMatrix: clone(matrixAsObj),
        transformMatrix: clone(matrixAsObj),
      };

      pageOptions.value[pageUid] = options;
    }

    return pageOptions.value[pageUid];
  }

  function setIsStylus(pageUid: TPrimaryKey, event: MouseEvent | TouchEvent) {
    const options = pageOptions.value[pageUid];
    const force = (event as TouchEvent).touches ? (event as TouchEvent).touches[0]["force"] : 0;
    options.isStylus = force > 0;
    options.detectedStylus = options.detectedStylus || options.isStylus;
  }

  return {
    pageOptions,
    canvasConfig,
    initPageOptions,
    selectedFillColor,
    selectedStrokeColor,
    setIsStylus,
  };
});
