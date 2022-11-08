import {
  ELEMENT_TYPE,
  CANVAS_NONDRAWING_TOOLS,
  DEFAULT_PEN_SIZE,
  LineEndSide,
  LineEndStyle,
  PageHistoryEvent,
} from "@/constants/core";
import type { IImageElementOptions, TPrimaryKey } from "@/types/core";

export default class PageScene {
  pageId: TPrimaryKey | undefined;
  elements: { [key: TPrimaryKey]: any } = {};
  elementOrder: TPrimaryKey[] = [];
  clearAllElementIndexes: number[] = [];
  isDebugMode = false;
  isPasteMode = false;
  isAddImageMode = false;
  isInteractiveEditMode = false;
  isTextboxEditMode = false;
  isRulerMode = false;
  isPanning = false;
  isMovingRuler = false;
  isDrawing = false;
  isStylus = false;
  detectedStylus = false;
  allowFingerDrawing = true;

  selectedTool: number = ELEMENT_TYPE.PEN;
  selectedToolSize = DEFAULT_PEN_SIZE;
  selectedLineEndSide = LineEndSide.NONE;
  selectedLineEndStyle = LineEndStyle.NONE;

  history: any[] = [];
  historyIndex = -1;

  initTransformMatrix: { a: number; b: number; c: number; d: number; e: number; f: number };
  transformMatrix: { a: number; b: number; c: number; d: number; e: number; f: number };

  constructor(
    pageId: TPrimaryKey,
    matrix: { a: number; b: number; c: number; d: number; e: number; f: number }
  ) {
    this.pageId = pageId;
    this.initTransformMatrix = {
      a: matrix.a,
      b: matrix.b,
      c: matrix.c,
      d: matrix.d,
      e: matrix.e,
      f: matrix.f,
    };
    this.transformMatrix = {
      a: matrix.a,
      b: matrix.b,
      c: matrix.c,
      d: matrix.d,
      e: matrix.e,
      f: matrix.f,
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
  get lastActiveElementId() {
    return this.activeElements[this.activeElements.length - 1];
  }
  get elementById() {
    return (id: TPrimaryKey) => this.elements[id];
  }
  get isDrawingAllowed() {
    const isOverlayMode =
      this.isPasteMode ||
      this.isAddImageMode ||
      this.isInteractiveEditMode ||
      this.isMovingRuler ||
      this.isTextboxEditMode;
    const isNonDrawingTool = CANVAS_NONDRAWING_TOOLS.includes(this.selectedTool);
    const stylusAllowed = this.detectedStylus && this.isStylus;
    const isFingerAllowed = !this.isStylus && this.allowFingerDrawing;

    return !isOverlayMode && !isNonDrawingTool && (stylusAllowed || isFingerAllowed);
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
