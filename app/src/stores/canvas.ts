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

  const activeElementsStartIdx = computed(() => (pageUid: TPrimaryKey) => {
    const options = pageOptions.value[pageUid];
    return options.clearAllElementIndexes.length > 0
      ? options.clearAllElementIndexes[options.clearAllElementIndexes.length - 1]
      : 0;
  });
  const activeElements = computed(() => (pageUid: TPrimaryKey) => {
    const options = pageOptions.value[pageUid];
    const startIdx = activeElementsStartIdx.value(pageUid);
    const postClear = options.elementOrder.slice(startIdx);
    return postClear.filter((uid) => !options.elements[uid].isDeleted);
  });
  const lastActiveElementUid = computed(() => (pageUid: TPrimaryKey) => {
    const elements = activeElements.value(pageUid);
    return elements[elements.length - 1];
  });
  const elementByUid = computed(() => (pageUid: TPrimaryKey, elementUid: TPrimaryKey) => {
    const options = pageOptions.value[pageUid];
    return options.elements[elementUid];
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
        elements: {},
        elementOrder: [],
        clearAllElementIndexes: [],

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

        history: [],
        historyIndex: -1,

        initTransformMatrix: clone(matrixAsObj),
        transformMatrix: clone(matrixAsObj),
      };

      pageOptions.value[pageUid] = options;
    }

    return pageOptions.value[pageUid];
  }

  function setElement(pageUid: TPrimaryKey, element: any) {
    const options = pageOptions.value[pageUid];
    options.elements[element.uid] = element;
    options.elementOrder.push(element.uid);

    return options.elements[element.uid];
  }

  function createElement(pageUid: TPrimaryKey, element: any) {
    setElement(pageUid, element);

    const updatedElement = showElement(pageUid, element.uid);
    const historyEvent: any = {
      type: PageHistoryEvent.ADD_CANVAS_ELEMENT,
      elementUid: element.uid,
    };

    if (element.tool === ELEMENT_TYPE.IMAGE) {
      historyEvent.image = (element.toolOptions as IImageElementOptions).image;
    }
    addHistoryEvent(pageUid, historyEvent);

    return updatedElement;
  }

  function deleteElement(pageUid: TPrimaryKey, elementUid: TPrimaryKey, trackHistory = true) {
    const updatedElement = hideElement(pageUid, elementUid);

    if (trackHistory) {
      addHistoryEvent(pageUid, {
        type: PageHistoryEvent.REMOVE_CANVAS_ELEMENT,
        elementUid: elementUid,
      });
    }
    return updatedElement;
  }

  function showElement(pageUid: TPrimaryKey, elementUid: TPrimaryKey) {
    const options = pageOptions.value[pageUid];
    const element = elementByUid.value(pageUid, elementUid);
    element.isDeleted = false;

    if (element.tool === ELEMENT_TYPE.CLEAR_ALL) {
      const elementIndex = options.elementOrder.indexOf(elementUid);
      options.clearAllElementIndexes.push(elementIndex);
      options.clearAllElementIndexes.sort((a, b) => a - b);
    }

    return element;
  }

  function hideElement(pageUid: TPrimaryKey, elementUid: TPrimaryKey) {
    const options = pageOptions.value[pageUid];
    const element = elementByUid.value(pageUid, elementUid);
    element.isDeleted = true;

    if (element.tool === ELEMENT_TYPE.CLEAR_ALL) {
      const elementIndex = options.elementOrder.indexOf(elementUid);
      options.clearAllElementIndexes = options.clearAllElementIndexes.filter(
        (i) => i !== elementIndex
      );
    }

    return element;
  }

  function setIsStylus(pageUid: TPrimaryKey, event: MouseEvent | TouchEvent) {
    const options = pageOptions.value[pageUid];
    const force = (event as TouchEvent).touches ? (event as TouchEvent).touches[0]["force"] : 0;
    options.isStylus = force > 0;
    options.detectedStylus = options.detectedStylus || options.isStylus;
  }

  function addHistoryEvent(pageUid: TPrimaryKey, event: any) {
    const options = pageOptions.value[pageUid];
    options.history.splice(options.historyIndex + 1);
    options.history.push(event);
    options.historyIndex = options.history.length - 1;
  }

  function popHistoryEvent(pageUid: TPrimaryKey) {
    const options = pageOptions.value[pageUid];
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
    lastActiveElementUid,
    elementByUid,
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
