import { defineStore } from "pinia";
import { computed, ref, type Ref } from "vue";
import { v4 as uuidv4 } from "uuid";
import {
  CanvasTool,
  CANVAS_INTERACTIVE_TOOLS,
  CANVAS_NONDRAWING_TOOLS,
  CANVAS_PAPER_TOOLS,
  DEFAULT_COLOR_SWATCHES,
  DEFAULT_PEN_SIZE,
  DEFAULT_SWATCH_KEY,
  LineEndSide,
  LineEndStyle,
  MAX_SWATCH_COLORS,
} from "@/constants/core";
import type { IElements, TColor, TPrimaryKey } from "@/types/core";
import { randomInteger } from "@/utils/math";

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

  const elements: Ref<IElements> = ref({});
  const elementOrder: Ref<TPrimaryKey[]> = ref([]);
  const clearAllElementIndexes: Ref<number[]> = ref([]);
  const activeElementsStartIdx = computed(() =>
    clearAllElementIndexes.value.length > 0
      ? clearAllElementIndexes.value[clearAllElementIndexes.value.length - 1]
      : 0
  );
  const activeElements = computed(() => {
    const postClear = elementOrder.value.slice(activeElementsStartIdx.value);
    return postClear.filter((id) => !elements.value[id].isDeleted);
  });
  const activeHtmlElements = computed(() =>
    activeElements.value.filter(
      (id: any) => elements.value[id].isHTMLElement && !elements.value[id].isDeleted
    )
  );
  const lastActiveElementId = computed(() => activeElements.value[activeElements.value.length - 1]);

  const ruler = ref({
    isVisible: false,
    width: canvasDiagSize.value,
    transform: {
      translate: [0, 0],
      scale: [1, 1],
      rotate: 35,
    },
  });
  const pasteTransform = ref({
    translate: [0, 0],
    scale: [1, 1],
    rotate: 0,
  });
  const imageTransform = ref({
    translate: [0, 0],
    scale: [1, 1],
    rotate: 0,
    clipType: "inset",
    clipStyles: [0, 0, 0, 0],
  });

  const debugMode = ref(false);
  const isPasteMode = ref(false);
  const isAddImageMode = ref(false);
  const isInteractiveEditMode = ref(false);
  const isTextboxEditMode = ref(false);
  const isPanning = ref(false);
  const isMovingRuler = ref(false);
  const isDrawing = ref(false);
  const isStylus = ref(false);
  const detectedStylus = ref(false);
  const allowFingerDrawing = ref(true);
  const showRulerControls = computed(() => {
    return !isDrawing.value && !isPanning.value;
  });
  const selectedTool = ref(CanvasTool.PEN);
  const isDrawingTool = computed(() => {
    return !CANVAS_NONDRAWING_TOOLS.includes(selectedTool.value);
  });
  const isNonDrawingTool = computed(() => {
    return CANVAS_NONDRAWING_TOOLS.includes(selectedTool.value);
  });
  const isPaperTool = computed(() => {
    return CANVAS_PAPER_TOOLS.includes(selectedTool.value);
  });
  const isInteractiveTool = computed(() => {
    return CANVAS_INTERACTIVE_TOOLS.includes(selectedTool.value);
  });
  const isDrawingAllowed = computed(() => {
    const isOverlayMode =
      isSwatchOpen.value ||
      isPasteMode.value ||
      isAddImageMode.value ||
      isInteractiveEditMode.value ||
      isMovingRuler.value ||
      isTextboxEditMode.value;
    const stylusAllowed = detectedStylus.value && isStylus.value;
    const isFingerAllowed = !isStylus.value && allowFingerDrawing.value;

    return !isOverlayMode && !isNonDrawingTool.value && (stylusAllowed || isFingerAllowed);
  });

  const selectedToolSize = ref(DEFAULT_PEN_SIZE);
  const selectedLineEndSide = ref(LineEndSide.NONE);
  const selectedLineEndStyle = ref(LineEndStyle.NONE);

  const history = ref([] as any[]);
  const historyIndex = ref(-1);
  const hasUndo = computed(() => historyIndex.value >= 0);
  const hasRedo = computed(() => historyIndex.value < history.value.length - 1);

  function addHistoryEvent(event) {
    history.value.splice(historyIndex.value + 1);
    history.value.push(event);
    historyIndex.value = history.value.length - 1;
  }

  function popHistoryEvent() {
    if (historyIndex.value < 0) return;
    history.value.pop();
    historyIndex.value -= 1;
  }

  const isSwatchOpen = ref(false);
  const swatches = ref(DEFAULT_COLOR_SWATCHES);
  const swatchOrder = ref([DEFAULT_SWATCH_KEY]);
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
    canvasConfig,
    canvasDiagSize,

    elements,
    elementOrder,
    clearAllElementIndexes,
    activeElementsStartIdx,
    activeElements,
    activeHtmlElements,
    lastActiveElementId,

    debugMode,
    isPasteMode,
    isAddImageMode,
    isInteractiveEditMode,
    isTextboxEditMode,
    isPanning,
    isDrawing,
    isStylus,
    detectedStylus,
    allowFingerDrawing,

    isMovingRuler,
    ruler,
    showRulerControls,

    pasteTransform,
    imageTransform,

    selectedTool,
    isDrawingTool,
    isNonDrawingTool,
    isPaperTool,
    isInteractiveTool,
    isDrawingAllowed,

    selectedToolSize,
    selectedLineEndSide,
    selectedLineEndStyle,

    history,
    historyIndex,
    hasUndo,
    hasRedo,
    addHistoryEvent,
    popHistoryEvent,

    swatches,
    swatchOrder,
    createSwatch,
    updateSwatchColor,
    isSwatchOpen,
  };
});
