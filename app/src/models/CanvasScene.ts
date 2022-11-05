import {
  ELEMENT_TYPE,
  CANVAS_NONDRAWING_TOOLS,
  CANVAS_PAPER_TOOLS,
  CANVAS_INTERACTIVE_TOOLS,
  DEFAULT_PEN_SIZE,
  LineEndSide,
  LineEndStyle,
  DEFAULT_SWATCH_KEY,
  SPECIAL_PAPER_SWATCH_KEY,
  DEFAULT_PAPER_COLOR_INDEX,
  DEFAULT_PATTERN_COLOR_INDEX,
  DEFAULT_PATTERN_OPACITY,
  DEFAULT_ELEMENT_FILLCOLOR_INDEX,
  SPECIAL_TOOL_SWATCH_KEY,
  DEFAULT_ELEMENT_STROKECOLOR_INDEX,
  PageHistoryEvent,
} from "@/constants/core";
import type {
  ICanvasSceneImageTransform,
  ICanvasScenePasteTransform,
  ICanvasSceneRuler,
  IImageElementOptions,
  TPrimaryKey,
} from "@/types/core";

export class CanvasScene {
  pageId: TPrimaryKey | undefined;
  canvasDiagSize = 0;
  elements: { [key: TPrimaryKey]: any } = {};
  elementOrder: TPrimaryKey[] = [];
  clearAllElementIndexes: number[] = [];
  activeElementId: TPrimaryKey | null = null;
  debugMode = false;
  isPasteMode = false;
  isAddImageMode = false;
  isInteractiveEditMode = false;
  isTextboxEditMode = false;
  isPanning = false;
  isMovingRuler = false;
  isDrawing = false;
  isStylus = false;
  detectedStylus = false;
  allowFingerDrawing = true;
  ruler: ICanvasSceneRuler;
  pasteTransform: ICanvasScenePasteTransform;
  imageTransform: ICanvasSceneImageTransform;
  selectedTool: number = ELEMENT_TYPE.PEN;
  selectedToolSize = DEFAULT_PEN_SIZE;
  selectedLineEndSide = LineEndSide.NONE;
  selectedLineEndStyle = LineEndStyle.NONE;
  history: any[] = [];
  historyIndex = -1;
  selectedPaperPatternIdx = 0;
  selectedPaperSwatchId = SPECIAL_PAPER_SWATCH_KEY;
  selectedPaperColorIdx = DEFAULT_PAPER_COLOR_INDEX;
  selectedPatternSwatchId = SPECIAL_PAPER_SWATCH_KEY;
  selectedPatternColorIdx = DEFAULT_PATTERN_COLOR_INDEX;
  selectedPatternOpacity = DEFAULT_PATTERN_OPACITY;
  selectedFillSwatchId = DEFAULT_SWATCH_KEY;
  selectedFillColorIdx = DEFAULT_ELEMENT_FILLCOLOR_INDEX;
  selectedStrokeSwatchId = SPECIAL_TOOL_SWATCH_KEY;
  selectedStrokeColorIdx = DEFAULT_ELEMENT_STROKECOLOR_INDEX;

  activePanCoords: { x: number; y: number }[] = [];
  initTransformMatrix: DOMMatrix;
  transformMatrix: DOMMatrix;
  paperPatternTransform = { x: 0, y: 0, lineSize: 0, spacing: 0 };

  constructor(pageId: TPrimaryKey, matrix: DOMMatrix, canvasDiagSize: number) {
    this.pageId = pageId;
    this.canvasDiagSize = canvasDiagSize;
    this.initTransformMatrix = DOMMatrix.fromMatrix(matrix);
    this.transformMatrix = matrix;
    this.ruler = {
      isVisible: false,
      width: this.canvasDiagSize,
      transform: {
        translate: [0, 0],
        scale: [1, 1],
        rotate: 35,
      },
    };
    this.pasteTransform = {
      translate: [0, 0],
      scale: [1, 1],
      rotate: 0,
    };
    this.imageTransform = {
      translate: [0, 0],
      scale: [1, 1],
      rotate: 0,
      clipType: "inset",
      clipStyles: [0, 0, 0, 0],
    };
  }

  get activeElementsStartIdx() {
    return this.clearAllElementIndexes.length > 0
      ? this.clearAllElementIndexes[this.clearAllElementIndexes.length - 1]
      : 0;
  }
  get activeElements() {
    const postClear = this.elementOrder.slice(this.activeElementsStartIdx);
    return postClear.filter((id) => !this.elements[id].isDeleted);
  }
  get activeHtmlElements() {
    return this.activeElements.filter(
      (id: TPrimaryKey) => this.elements[id].isHTMLElement && !this.elements[id].isDeleted
    );
  }
  get lastActiveElementId() {
    return this.activeElements[this.activeElements.length - 1];
  }
  get elementById() {
    return (id: TPrimaryKey) => this.elements[id];
  }
  get showRulerControls() {
    return !this.isDrawing && !this.isPanning;
  }
  get isDrawingTool() {
    return !CANVAS_NONDRAWING_TOOLS.includes(this.selectedTool);
  }
  get isNonDrawingTool() {
    return CANVAS_NONDRAWING_TOOLS.includes(this.selectedTool);
  }
  get isPaperTool() {
    return CANVAS_PAPER_TOOLS.includes(this.selectedTool);
  }
  get isInteractiveTool() {
    return CANVAS_INTERACTIVE_TOOLS.includes(this.selectedTool);
  }
  get isDrawingAllowed() {
    const isOverlayMode =
      this.isPasteMode ||
      this.isAddImageMode ||
      this.isInteractiveEditMode ||
      this.isMovingRuler ||
      this.isTextboxEditMode;
    const stylusAllowed = this.detectedStylus && this.isStylus;
    const isFingerAllowed = !this.isStylus && this.allowFingerDrawing;

    return !isOverlayMode && !this.isNonDrawingTool && (stylusAllowed || isFingerAllowed);
  }
  get hasUndo() {
    return this.historyIndex >= 0;
  }
  get hasRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  setElement(element: any) {
    this.elements[element.id] = element;
    this.elementOrder.push(element.id);

    return this.elements[element.id];
  }

  createElement(element: any) {
    this.setElement(element);

    const updatedElement = this.showElement(element.id);
    const historyEvent: any = {
      type: PageHistoryEvent.ADD_CANVAS_ELEMENT,
      elementId: element.id,
    };

    if (element.tool === ELEMENT_TYPE.IMAGE) {
      historyEvent.image = (element.toolOptions as IImageElementOptions).image;
    }
    this.addHistoryEvent(historyEvent);

    return updatedElement;
  }

  deleteElement(elementId: TPrimaryKey, trackHistory = true) {
    const updatedElement = this.hideElement(elementId);

    if (trackHistory) {
      this.addHistoryEvent({
        type: PageHistoryEvent.REMOVE_CANVAS_ELEMENT,
        elementId: elementId,
      });
    }
    return updatedElement;
  }

  showElement(elementId: TPrimaryKey) {
    const element = this.elementById(elementId);
    element.isDeleted = false;

    if (element.tool === ELEMENT_TYPE.CLEAR_ALL) {
      const elementIndex = this.elementOrder.indexOf(elementId);
      this.clearAllElementIndexes.push(elementIndex);
      this.clearAllElementIndexes.sort((a, b) => a - b);
    }

    return element;
  }

  hideElement(elementId: TPrimaryKey) {
    const element = this.elementById(elementId);
    element.isDeleted = true;

    if (element.tool === ELEMENT_TYPE.CLEAR_ALL) {
      const elementIndex = this.elementOrder.indexOf(elementId);
      this.clearAllElementIndexes = this.clearAllElementIndexes.filter((i) => i !== elementIndex);
    }

    return element;
  }

  setIsStylus(event: MouseEvent | TouchEvent) {
    const force = (event as TouchEvent).touches ? (event as TouchEvent).touches[0]["force"] : 0;
    this.isStylus = force > 0;
    this.detectedStylus = this.detectedStylus || this.isStylus;
  }

  addHistoryEvent(event: any) {
    this.history.splice(this.historyIndex + 1);
    this.history.push(event);
    this.historyIndex = this.history.length - 1;
  }

  popHistoryEvent() {
    if (this.historyIndex < 0) return;
    this.history.pop();
    this.historyIndex -= 1;
  }
}
