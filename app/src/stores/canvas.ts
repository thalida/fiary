import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type {
  IImageElementOptions,
  IPageOptions,
  ITransformMatrix,
  TPrimaryKey,
} from "@/types/core";
import {
  DEFAULT_PEN_SIZE,
  ELEMENT_TYPE,
  LineEndSide,
  LineEndStyle,
  PageHistoryEvent,
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

  const activeElementsStartIdx = computed(() => (pageId: TPrimaryKey) => {
    const options = pageOptions.value[pageId];
    return options.clearAllElementIndexes.length > 0
      ? options.clearAllElementIndexes[options.clearAllElementIndexes.length - 1]
      : 0;
  });
  const activeElements = computed(() => (pageId: TPrimaryKey) => {
    const options = pageOptions.value[pageId];
    const startIdx = activeElementsStartIdx.value(pageId);
    const postClear = options.elementOrder.slice(startIdx);
    return postClear.filter((id) => !options.elements[id].isDeleted);
  });
  const lastActiveElementId = computed(() => (pageId: TPrimaryKey) => {
    const elements = activeElements.value(pageId);
    return elements[elements.length - 1];
  });
  const elementById = computed(() => (pageId: TPrimaryKey, elementId: TPrimaryKey) => {
    const options = pageOptions.value[pageId];
    return options.elements[elementId];
  });

  function initPageOptions(pageId: TPrimaryKey, matrix: ITransformMatrix) {
    if (typeof pageOptions.value[pageId] === "undefined") {
      const matrixAsObj = {
        a: matrix.a,
        b: matrix.b,
        c: matrix.c,
        d: matrix.d,
        e: matrix.e,
        f: matrix.f,
      };
      const options = {
        elements: {},
        elementOrder: [],
        clearAllElementIndexes: [],

        fillPaletteId: coreStore.builtinPalettes[PALETTE_TYPES.TOOL_FILL]?.palette,
        fillSwatchId: coreStore.builtinPalettes[PALETTE_TYPES.TOOL_FILL]?.swatch,
        strokePaletteId: coreStore.builtinPalettes[PALETTE_TYPES.TOOL_STROKE]?.palette,
        strokeSwatchId: coreStore.builtinPalettes[PALETTE_TYPES.TOOL_STROKE]?.swatch,

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

        history: [],
        historyIndex: -1,

        initTransformMatrix: clone(matrixAsObj),
        transformMatrix: clone(matrixAsObj),
      };

      pageOptions.value[pageId] = options;
    }

    return pageOptions.value[pageId];
  }

  function setElement(pageId: TPrimaryKey, element: any) {
    const options = pageOptions.value[pageId];
    options.elements[element.id] = element;
    options.elementOrder.push(element.id);

    return options.elements[element.id];
  }

  function createElement(pageId: TPrimaryKey, element: any) {
    setElement(pageId, element);

    const updatedElement = showElement(pageId, element.id);
    const historyEvent: any = {
      type: PageHistoryEvent.ADD_CANVAS_ELEMENT,
      elementId: element.id,
    };

    if (element.tool === ELEMENT_TYPE.IMAGE) {
      historyEvent.image = (element.toolOptions as IImageElementOptions).image;
    }
    addHistoryEvent(pageId, historyEvent);

    return updatedElement;
  }

  function deleteElement(pageId: TPrimaryKey, elementId: TPrimaryKey, trackHistory = true) {
    const updatedElement = hideElement(pageId, elementId);

    if (trackHistory) {
      addHistoryEvent(pageId, {
        type: PageHistoryEvent.REMOVE_CANVAS_ELEMENT,
        elementId: elementId,
      });
    }
    return updatedElement;
  }

  function showElement(pageId: TPrimaryKey, elementId: TPrimaryKey) {
    const options = pageOptions.value[pageId];
    const element = elementById.value(pageId, elementId);
    element.isDeleted = false;

    if (element.tool === ELEMENT_TYPE.CLEAR_ALL) {
      const elementIndex = options.elementOrder.indexOf(elementId);
      options.clearAllElementIndexes.push(elementIndex);
      options.clearAllElementIndexes.sort((a, b) => a - b);
    }

    return element;
  }

  function hideElement(pageId: TPrimaryKey, elementId: TPrimaryKey) {
    const options = pageOptions.value[pageId];
    const element = elementById.value(pageId, elementId);
    element.isDeleted = true;

    if (element.tool === ELEMENT_TYPE.CLEAR_ALL) {
      const elementIndex = options.elementOrder.indexOf(elementId);
      options.clearAllElementIndexes = options.clearAllElementIndexes.filter(
        (i) => i !== elementIndex
      );
    }

    return element;
  }

  function setIsStylus(pageId: TPrimaryKey, event: MouseEvent | TouchEvent) {
    const options = pageOptions.value[pageId];
    const force = (event as TouchEvent).touches ? (event as TouchEvent).touches[0]["force"] : 0;
    options.isStylus = force > 0;
    options.detectedStylus = options.detectedStylus || options.isStylus;
  }

  function addHistoryEvent(pageId: TPrimaryKey, event: any) {
    const options = pageOptions.value[pageId];
    options.history.splice(options.historyIndex + 1);
    options.history.push(event);
    options.historyIndex = options.history.length - 1;
  }

  function popHistoryEvent(pageId: TPrimaryKey) {
    const options = pageOptions.value[pageId];
    if (options.historyIndex < 0) return;
    options.history.pop();
    options.historyIndex -= 1;
  }

  return {
    pageOptions,
    canvasConfig,
    initPageOptions,
    selectedFillColor,
    selectedStrokeColor,
    activeElementsStartIdx,
    activeElements,
    lastActiveElementId,
    elementById,
    setElement,
    createElement,
    deleteElement,
    showElement,
    hideElement,
    setIsStylus,
    addHistoryEvent,
    popHistoryEvent,
  };
});
