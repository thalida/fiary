import { getStroke } from "perfect-freehand";
import {
  CanvasTool,
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
  CANVAS_LINE_TOOLS,
  PageHistoryEvent,
} from "@/constants/core";
import type {
  ICanvasElement,
  ICanvasSceneImageTransform,
  ICanvasScenePasteTransform,
  ICanvasSceneRuler,
  IElementPoint,
  IElements,
  IImageElementOptions,
  ILineElementOptions,
  TElement,
  TPrimaryKey,
} from "@/types/core";
import { isTransparent } from "@/utils/color";

export class CanvasScene {
  pageId: TPrimaryKey | undefined;
  canvasDiagSize = 0;
  elements: { [key: TPrimaryKey]: any } = {};
  elementOrder: TPrimaryKey[] = [];
  clearAllElementIndexes: number[] = [];
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
  selectedTool = CanvasTool.PEN;
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

    if (element.tool === CanvasTool.IMAGE) {
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

    if (element.tool === CanvasTool.CLEAR_ALL) {
      const elementIndex = this.elementOrder.indexOf(elementId);
      this.clearAllElementIndexes.push(elementIndex);
      this.clearAllElementIndexes.sort((a, b) => a - b);
    }

    return element;
  }

  hideElement(elementId: TPrimaryKey) {
    const element = this.elementById(elementId);
    element.isDeleted = true;

    if (element.tool === CanvasTool.CLEAR_ALL) {
      const elementIndex = this.elementOrder.indexOf(elementId);
      this.clearAllElementIndexes = this.clearAllElementIndexes.filter((i) => i !== elementIndex);
    }

    return element;
  }

  setIsStylus(event: Event) {
    const force = event.touches ? event.touches[0]["force"] : 0;
    this.isStylus = force > 0;
    this.detectedStylus = this.detectedStylus || this.isStylus;
  }

  getPressure(event): number {
    if (this.selectedTool === CanvasTool.PEN) {
      return this.isStylus ? event.touches[0]["force"] : 1;
    }

    return 0.5;
  }

  getComposition() {
    if (this.selectedTool === CanvasTool.ERASER) {
      return "destination-out";
    }

    if (this.selectedTool === CanvasTool.MARKER) {
      return "hard-light";
    }

    if (this.selectedTool === CanvasTool.HIGHLIGHTER) {
      return "hue";
    }

    return "source-over";
  }

  getOpacity(): number {
    if (this.selectedTool === CanvasTool.MARKER) {
      return 0.9;
    }

    if (this.selectedTool === CanvasTool.HIGHLIGHTER) {
      return 0.75;
    }

    return 1;
  }

  addHistoryEvent(event) {
    this.history.splice(this.historyIndex + 1);
    this.history.push(event);
    this.historyIndex = this.history.length - 1;
  }

  popHistoryEvent() {
    if (this.historyIndex < 0) return;
    this.history.pop();
    this.historyIndex -= 1;
  }

  getSmoothPoints(element: ICanvasElement) {
    const stroke = getStroke(element.points, {
      ...element.freehandOptions,
      size: element.freehandOptions.size * 1.5,
      thinning: element.freehandOptions.thinning / 1.5,
    });
    const path = getStroke(element.points, element.freehandOptions);

    return {
      stroke,
      path,
    };
  }

  getSvgPathFromStroke(stroke: number[][]) {
    if (!stroke.length) return "";

    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length];
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        return acc;
      },
      ["M", ...stroke[0], "Q"]
    );

    d.push("Z");
    return d.join(" ");
  }

  calculateDimensions(element: TElement) {
    let xPoints, yPoints;
    if (CANVAS_LINE_TOOLS.includes(element.tool)) {
      xPoints = element.smoothPoints.path.map((point: number[]) => point[0]);
      yPoints = element.smoothPoints.path.map((point: number[]) => point[1]);
    } else {
      xPoints = element.points.map(({ x }: { x: number }) => x);
      yPoints = element.points.map(({ y }: { y: number }) => y);
    }

    const minX = Math.min(...xPoints);
    const minY = Math.min(...yPoints);
    const maxX = Math.max(...xPoints);
    const maxY = Math.max(...yPoints);
    const width = maxX - minX;
    const height = maxY - minY;

    let outerMinX = minX;
    let outerMinY = minY;
    let outerMaxX = maxX;
    let outerMaxY = maxY;

    if (CANVAS_LINE_TOOLS.includes(element.tool) && !isTransparent(element.strokeColor)) {
      const outerXPoints = element.smoothPoints.stroke.map((point: number[]) => point[0]);
      const outerYPoints = element.smoothPoints.stroke.map((point: number[]) => point[1]);
      outerMinX = Math.min(...outerXPoints);
      outerMinY = Math.min(...outerYPoints);
      outerMaxX = Math.max(...outerXPoints);
      outerMaxY = Math.max(...outerYPoints);
    } else if (element.tool === CanvasTool.LINE) {
      const strokeSize = !isTransparent(element.strokeColor)
        ? element.size * 0.75
        : element.size / 2;
      outerMinX -= strokeSize;
      outerMinY -= strokeSize;
      outerMaxX += strokeSize;
      outerMaxY += strokeSize;
    } else {
      let strokeSize = 0;
      if (
        !isTransparent(element.strokeColor) ||
        element.tool === CanvasTool.BLOB ||
        element.tool === CanvasTool.ERASER
      ) {
        strokeSize = element.size / 2;
      }

      outerMinX -= strokeSize;
      outerMinY -= strokeSize;
      outerMaxX += strokeSize;
      outerMaxY += strokeSize;
    }

    const outerWidth = outerMaxX - outerMinX;
    const outerHeight = outerMaxY - outerMinY;
    const dimensions = {
      minX,
      minY,
      maxX,
      maxY,
      outerMinX,
      outerMinY,
      outerMaxX,
      outerMaxY,
      width,
      height,
      outerWidth,
      outerHeight,
      lineLength: null as number | null,
    };

    if (CANVAS_LINE_TOOLS.includes(element.tool)) {
      dimensions.lineLength = Math.sqrt(
        Math.pow(dimensions.width, 2) + Math.pow(dimensions.height, 2)
      );
    }

    return dimensions;
  }

  calculateLinePoints(element: ICanvasElement, toPos: { x: number; y: number }): IElementPoint[] {
    const fromx = element.points[0].x;
    const fromy = element.points[0].y;
    const tox = toPos.x;
    const toy = toPos.y;

    const toolOptions = element.toolOptions as unknown as ILineElementOptions;

    if (
      toolOptions.lineEndStyle === LineEndStyle.NONE ||
      toolOptions.lineEndSide === LineEndSide.NONE
    ) {
      return [
        { x: fromx, y: fromy },
        { x: toPos.x, y: toPos.y },
      ];
    } else if (toolOptions.lineEndStyle === LineEndStyle.ARROW) {
      const headlen = element.size * 2; // length of head in pixels
      const endAngle = Math.atan2(toy - fromy, tox - fromx);
      const endA1 = {
        x: tox - headlen * Math.cos(endAngle - Math.PI / 5),
        y: toy - headlen * Math.sin(endAngle - Math.PI / 5),
      };
      const endA2 = {
        x: tox - headlen * Math.cos(endAngle + Math.PI / 5),
        y: toy - headlen * Math.sin(endAngle + Math.PI / 5),
      };
      const endPoints = [endA1, endA2];

      let startAngle;
      let startPoints: IElementPoint[] = [];
      if (toolOptions.lineEndSide === LineEndSide.BOTH) {
        startAngle = Math.atan2(fromy - toy, fromx - tox);
        const startA1 = {
          x: fromx - headlen * Math.cos(startAngle - Math.PI / 5),
          y: fromy - headlen * Math.sin(startAngle - Math.PI / 5),
        };
        const startA2 = {
          x: fromx - headlen * Math.cos(startAngle + Math.PI / 5),
          y: fromy - headlen * Math.sin(startAngle + Math.PI / 5),
        };
        startPoints = [startA1, startA2];
      }

      return [{ x: fromx, y: fromy }, ...startPoints, ...endPoints, { x: toPos.x, y: toPos.y }];
    } else if (
      toolOptions.lineEndStyle === LineEndStyle.SQUARE ||
      toolOptions.lineEndStyle === LineEndStyle.CIRCLE
    ) {
      const headSize = element.size * 2;
      const endStartPoint = {
        x: tox - headSize / 2,
        y: toy - headSize / 2,
      };
      const endEndPoint = {
        x: tox + headSize / 2,
        y: toy + headSize / 2,
      };
      const endPoints = [endStartPoint, endEndPoint];

      let startPoints: IElementPoint[] = [];
      if (toolOptions.lineEndSide === LineEndSide.BOTH) {
        const startStartPoint = {
          x: fromx - headSize / 2,
          y: fromy - headSize / 2,
        };
        const startEndPoint = {
          x: fromx + headSize / 2,
          y: fromy + headSize / 2,
        };
        startPoints = [startStartPoint, startEndPoint];
      }

      return [{ x: fromx, y: fromy }, ...startPoints, ...endPoints, { x: toPos.x, y: toPos.y }];
    }

    return [];
  }
}
