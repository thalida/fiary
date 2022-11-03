<script setup lang="ts">
import { ref, computed, watch, watchEffect, watchPostEffect, onMounted, nextTick } from "vue";
import { v4 as uuidv4 } from "uuid";
import cloneDeep from "lodash/cloneDeep";
import { getStroke } from "perfect-freehand";
import Moveable from "moveable";
import Selecto from "selecto";
import MoveableVue from "vue3-moveable";
import Ftextarea from "./CanvasTextarea.vue";
import patternComponents, { defaultPatternProps } from "@/components/CanvasPatterns";

import { useCanvasStore } from "@/stores/canvas";
import {
  PageHistoryEvent as HistoryEvent,
  CanvasTool as Tool,
  CANVAS_TOOL_CHOICES as supportedTools,
  CANVAS_LINE_TOOLS,
  LineEndSide,
  LINE_END_SIDE_CHOICES,
  LineEndStyle,
  LINE_END_STYLE_CHOICES,
  PEN_SIZES,
  TRANSPARENT_COLOR,
  SPECIAL_TOOL_SWATCH_KEY,
  SPECIAL_PAPER_SWATCH_KEY,
} from "@/constants/core";
import ColorPicker from "@/components/ColorPicker.vue";
import type {
  ICanvasElement,
  ICheckboxElementOptions,
  IClearElement,
  IInteractiveElement,
  ILineElementOptions,
  ISolidColor,
  ITextboxElementOptions,
  TColor,
  TElement,
} from "@/types/core";

console.log("Updated CanvasScene");
const canvasStore = useCanvasStore();

const activeTextbox = ref(null);
const activeImage = ref(null);

let activePanCoords: { x: number; y: number }[] = [];
let initTransformMatrix: DOMMatrix | undefined;
const transformMatrix = ref(undefined as DOMMatrix | undefined);
const interactiveCanvasTransform = ref();
const paperPatternTransform = ref({ x: 0, y: 0, lineSize: 0, spacing: 0 });

const drawingCanvas = ref<HTMLCanvasElement>();
const interactiveCanvas = ref();
const imagePreviewCanvas = ref<HTMLCanvasElement>();
const imageBackdropCanvas = ref<HTMLCanvasElement>();
const pasteLayer = ref<HTMLElement>();
const pasteCanvas = ref<HTMLCanvasElement>();
const moveableRuler = ref();
let moveablePaste: any = null;
const moveableImage = ref();
const rulerElement = ref();

const paperPatterns = ref(patternComponents);
const patternStyles = ref(defaultPatternProps);
const selectedPaperPatternIdx = ref(0);
const selectedPaperPattern = computed(() => paperPatterns.value[selectedPaperPatternIdx.value]);
const selectedPatternStyles = computed(() => patternStyles.value[selectedPaperPatternIdx.value]);

const colorPickerRefs: any[] = [];

onMounted(() => {
  if (typeof drawingCanvas.value === "undefined") {
    return;
  }

  const ctx = drawingCanvas.value.getContext("2d");

  if (ctx === null) {
    return;
  }

  const dpi = canvasStore.canvasConfig.dpi;
  drawingCanvas.value.width = canvasStore.canvasConfig.width * dpi;
  drawingCanvas.value.height = canvasStore.canvasConfig.height * dpi;

  drawingCanvas.value.style.width = `${canvasStore.canvasConfig.width}px`;
  drawingCanvas.value.style.height = `${canvasStore.canvasConfig.height}px`;

  ctx.scale(dpi, dpi);

  initTransformMatrix = ctx.getTransform();
  transformMatrix.value = ctx.getTransform();
});

watch(
  () => canvasStore.debugMode,
  () => {
    drawElements();
  }
);

watchPostEffect(() => {
  if (canvasStore.ruler.isVisible) {
    setRulerTransform(rulerElement.value, {});
  }
});

watchEffect(() => {
  setRenderTransforms(transformMatrix.value);
});

function addColorPickerRef(ref: any) {
  colorPickerRefs.push(ref);
}

function handleToolChange(event) {
  if (canvasStore.selectedTool === Tool.CLEAR_ALL) {
    handleClearAll();
  }

  canvasStore.isTextboxEditMode = false;
  activeTextbox.value = null;

  event.target.blur();
}

function checkIsStylus(event) {
  const force = event.touches ? event.touches[0]["force"] : 0;
  canvasStore.isStylus = force > 0;
  canvasStore.detectedStylus = canvasStore.detectedStylus || canvasStore.isStylus;
}

function isDrawingAllowed(isDrawingOverride = false) {
  const activelyDrawing = canvasStore.isDrawing || isDrawingOverride;
  return canvasStore.isDrawingAllowed && activelyDrawing;
}

function getPressure(event): number {
  if (canvasStore.selectedTool === Tool.PEN) {
    return canvasStore.isStylus ? event.touches[0]["force"] : 1;
  }

  return 0.5;
}

function getComposition() {
  if (canvasStore.selectedTool === Tool.ERASER) {
    return "destination-out";
  }

  if (canvasStore.selectedTool === Tool.MARKER) {
    return "hard-light";
  }

  if (canvasStore.selectedTool === Tool.HIGHLIGHTER) {
    return "hue";
  }

  return "source-over";
}

function getOpacity(): number {
  if (canvasStore.selectedTool === Tool.MARKER) {
    return 0.9;
  }

  if (canvasStore.selectedTool === Tool.HIGHLIGHTER) {
    return 0.75;
  }

  return 1;
}

function isTransparent(color: TColor) {
  const isGradient = Array.isArray(color);
  return !isGradient && color.a === 0;
}

function formatColor(color: ISolidColor, opacity = 1) {
  if (isTransparent(color)) {
    return "transparent";
  }

  return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
}

function getSmoothPoints(element: ICanvasElement) {
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

function calculateDimensions(element: TElement) {
  let xPoints, yPoints;
  if (CANVAS_LINE_TOOLS.includes(element.tool)) {
    xPoints = element.smoothPoints.path.map((point) => point[0]);
    yPoints = element.smoothPoints.path.map((point) => point[1]);
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
    const outerXPoints = element.smoothPoints.stroke.map((point) => point[0]);
    const outerYPoints = element.smoothPoints.stroke.map((point) => point[1]);
    outerMinX = Math.min(...outerXPoints);
    outerMinY = Math.min(...outerYPoints);
    outerMaxX = Math.max(...outerXPoints);
    outerMaxY = Math.max(...outerYPoints);
  } else if (element.tool === Tool.LINE) {
    const strokeSize = !isTransparent(element.strokeColor) ? element.size * 0.75 : element.size / 2;
    outerMinX -= strokeSize;
    outerMinY -= strokeSize;
    outerMaxX += strokeSize;
    outerMaxY += strokeSize;
  } else {
    let strokeSize = 0;
    if (
      !isTransparent(element.strokeColor) ||
      element.tool === Tool.BLOB ||
      element.tool === Tool.ERASER
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

function calculateLinePoints(element: ICanvasElement, toPos: { x: number; y: number }): any {
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
    let startPoints: any[] = [];
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

    let startPoints: any[] = [];
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
}

function getMousePos(canvas, event, followRuler = false) {
  const rect = canvas.getBoundingClientRect(); // abs. size of element
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  let inputX = clientX;
  let inputY = clientY;
  let isRulerLine = false;

  if (followRuler && canvasStore.ruler.isVisible && moveableRuler.value) {
    const searchDistance = 25;
    let foundX, foundY;
    let searchFor = true;
    let isFirstLoop = true;

    let dx = 0;
    while (dx <= searchDistance) {
      const rx1 = clientX - dx;
      const rx2 = clientX + dx;

      let dy = 0;
      while (dy <= searchDistance) {
        const ry1 = clientY - dy;
        const ry2 = clientY + dy;
        const searchDirections = [
          [rx1, ry1],
          [rx1, ry2],
          [rx2, ry1],
          [rx2, ry2],
        ];

        for (let i = 0; i < searchDirections.length; i += 1) {
          const searchDirection = searchDirections[i];
          const isInside = moveableRuler.value.isInside(searchDirection[0], searchDirection[1]);

          if (isFirstLoop) {
            searchFor = !isInside;
            isFirstLoop = false;
          }

          if (isInside === searchFor) {
            foundX = searchDirection[0];
            foundY = searchDirection[1];
            break;
          }
        }

        if (typeof foundX !== "undefined" && typeof foundY !== "undefined") {
          break;
        }

        dy += 1;
      }

      if (typeof foundX !== "undefined" && typeof foundY !== "undefined") {
        break;
      }

      dx += 1;
    }

    if (typeof foundX !== "undefined" && typeof foundY !== "undefined") {
      isRulerLine = true;
      inputX = foundX;
      inputY = foundY;
    }
  }

  const x = inputX - rect.left;
  const y = inputY - rect.top;
  return { x, y, isRulerLine };
}

function getDrawPos(canvas, event, followRuler = false) {
  const pos = getMousePos(canvas, event, followRuler);
  let cameraX = transformMatrix.value ? transformMatrix.value.e : 0;
  let cameraY = transformMatrix.value ? transformMatrix.value.f : 0;
  const cameraZoom = transformMatrix.value ? transformMatrix.value.a : 1;
  const initMatrixA = initTransformMatrix ? initTransformMatrix.a : 1;
  const relativeZoom = initMatrixA / cameraZoom;

  if (canvasStore.isInteractiveTool) {
    cameraX /= cameraZoom;
    cameraY /= cameraZoom;
  }

  const transformedPos = {
    x: pos.x * relativeZoom - cameraX,
    y: pos.y * relativeZoom - cameraY,
  };

  return {
    ...pos,
    ...transformedPos,
  };
}

function getSvgPathFromStroke(stroke) {
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

function getFlatSvgPathFromStroke(stroke) {
  return getSvgPathFromStroke(stroke);
  // const faces = polygonClipping.union([stroke])

  // const d = []

  // faces.forEach((face) =>
  //   face.forEach((points) => {
  //     d.push(getSvgPathFromStroke(points))
  //   })
  // )

  // return d.join(' ')
}

function getCanvasElement(elementId) {
  return canvasStore.elements[elementId];
}

function setCanvasElement(element) {
  canvasStore.elements[element.id] = element;

  return canvasStore.elements[element.id];
}

function createCanvasElement(element) {
  setCanvasElement(element);
  canvasStore.elementOrder.push(element.id);

  const updatedElement = showCanvasElement(element.id);
  const historyEvent: any = {
    type: HistoryEvent.ADD_CANVAS_ELEMENT,
    elementId: element.id,
  };

  if (element.tool === Tool.IMAGE) {
    historyEvent.image = element.toolOptions.image;
  }
  canvasStore.addHistoryEvent(historyEvent);

  return updatedElement;
}

function deleteCanvasElement(elementId, trackHistory = true) {
  const updatedElement = hideCanvasElement(elementId);

  if (trackHistory) {
    canvasStore.addHistoryEvent({
      type: HistoryEvent.REMOVE_CANVAS_ELEMENT,
      elementId: elementId,
    });
  }
  return updatedElement;
}

function showCanvasElement(elementId) {
  const element = getCanvasElement(elementId);
  element.isDeleted = false;

  if (element.tool === Tool.CLEAR_ALL) {
    const elementIndex = canvasStore.elementOrder.indexOf(elementId);
    canvasStore.clearAllElementIndexes.push(elementIndex);
    canvasStore.clearAllElementIndexes.sort((a, b) => a - b);
  }

  return element;
}

function hideCanvasElement(elementId) {
  const element = getCanvasElement(elementId);
  element.isDeleted = true;

  if (element.tool === Tool.CLEAR_ALL) {
    const elementIndex = canvasStore.elementOrder.indexOf(elementId);
    canvasStore.clearAllElementIndexes = canvasStore.clearAllElementIndexes.filter(
      (i) => i !== elementIndex
    );
  }

  return element;
}

function cacheElement(element) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (ctx === null) {
    return;
  }

  const dpi = window.devicePixelRatio;

  const minX = element.dimensions.outerMinX;
  const minY = element.dimensions.outerMinY;
  const width = element.dimensions.outerWidth;
  const height = element.dimensions.outerHeight;

  canvas.width = width * dpi;
  canvas.height = height * dpi;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.save();
  ctx.scale(dpi, dpi);
  ctx.translate(-minX, -minY);
  drawElement(canvas, element, true);
  ctx.restore();

  element.isDrawingCached = true;
  element.cache.drawing = {
    x: minX,
    y: minY,
    width,
    height,
    dpi,
    canvas,
  };
}

function drawElement(canvas, element, isCaching = false) {
  if (
    element.isHTMLElement ||
    element.isDeleted ||
    element.dimensions.outerWidth === 0 ||
    element.dimensions.outerHeight === 0
  ) {
    return;
  }

  const ctx = canvas.getContext("2d");

  if (element.isDrawingCached) {
    const cachedCanvas = element.cache.drawing.canvas;
    const dpi = element.cache.drawing.dpi;
    ctx.save();
    ctx.globalCompositeOperation = element.composition;
    ctx.translate(element.cache.drawing.x, element.cache.drawing.y);
    ctx.drawImage(cachedCanvas, 0, 0, cachedCanvas.width / dpi, cachedCanvas.height / dpi);
    ctx.restore();

    if (canvasStore.debugMode) {
      ctx.save();
      ctx.beginPath();
      ctx.translate(element.cache.drawing.x, element.cache.drawing.y);
      ctx.rect(0, 0, cachedCanvas.width / dpi, cachedCanvas.height / dpi);
      ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();
    }
    return;
  }

  const points = element.points.slice();
  const { minX, minY, maxX, maxY } = element.dimensions;

  ctx.save();

  if (
    isCaching &&
    (element.tool === Tool.ERASER || element.tool === Tool.CUT || element.tool === Tool.CLEAR_ALL)
  ) {
    ctx.globalCompositeOperation = "source-over";
  } else {
    ctx.globalCompositeOperation = element.composition;
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = element.size;

  if (Array.isArray(element.strokeColor)) {
    let gradientStartX, gradientStartY, gradientEndX, gradientEndY;

    if (Math.abs(minX - points[0].x) <= Math.abs(maxX - points[0].x)) {
      gradientStartX = minX;
      gradientEndX = maxX;
    } else {
      gradientStartX = maxX;
      gradientEndX = minX;
    }

    if (Math.abs(minY - points[0].y) <= Math.abs(maxY - points[0].y)) {
      gradientStartY = minY;
      gradientEndY = maxY;
    } else {
      gradientStartY = maxY;
      gradientEndY = minY;
    }

    const gradient = ctx.createLinearGradient(
      gradientStartX,
      gradientStartY,
      gradientEndX,
      gradientEndY
    );
    for (let j = 0; j < element.strokeColor.length; j += 1) {
      const colorStop = element.strokeColor[j];
      const stop = colorStop.percent / 100;
      const color = formatColor(colorStop.color, element.opacity);
      gradient.addColorStop(stop, color);
    }
    ctx.strokeStyle = gradient;
  } else {
    ctx.strokeStyle = formatColor(element.strokeColor, element.opacity);
  }

  if (Array.isArray(element.fillColor)) {
    let gradientStartX, gradientStartY, gradientEndX, gradientEndY;
    if (Math.abs(minX - points[0].x) <= Math.abs(maxX - points[0].x)) {
      gradientStartX = minX;
      gradientEndX = maxX;
    } else {
      gradientStartX = maxX;
      gradientEndX = minX;
    }
    if (Math.abs(minY - points[0].y) <= Math.abs(maxY - points[0].y)) {
      gradientStartY = minY;
      gradientEndY = maxY;
    } else {
      gradientStartY = maxY;
      gradientEndY = minY;
    }

    const gradient = ctx.createLinearGradient(
      gradientStartX,
      gradientStartY,
      gradientEndX,
      gradientEndY
    );
    for (let j = 0; j < element.fillColor.length; j += 1) {
      const colorStop = element.fillColor[j];
      const stop = colorStop.percent / 100;
      const color = formatColor(colorStop.color, element.opacity);
      gradient.addColorStop(stop, color);
    }
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = formatColor(element.fillColor, element.opacity);
  }

  if (CANVAS_LINE_TOOLS.includes(element.tool)) {
    ctx.save();
    ctx.beginPath();
    const strokePoints = element.smoothPoints.stroke;
    ctx.moveTo(strokePoints[0][0], strokePoints[0][1]);
    const strokeData = getFlatSvgPathFromStroke(strokePoints);
    const myStroke = new Path2D(strokeData);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill(myStroke);
    ctx.restore();

    ctx.save();
    if (isTransparent(element.fillColor)) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "#fff";
    }
    ctx.beginPath();
    const pathPoints = element.smoothPoints.path;
    ctx.moveTo(pathPoints[0][0], pathPoints[0][1]);
    const pathData = getFlatSvgPathFromStroke(pathPoints);
    const myPath = new Path2D(pathData);
    ctx.fill(myPath);
    ctx.restore();
  } else if (element.tool === Tool.CIRCLE) {
    ctx.beginPath();
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const radX = Math.abs(midX - minX);
    const radY = Math.abs(midY - minY);

    ctx.ellipse(midX, midY, radX, radY, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
  } else if (element.tool === Tool.TRIANGLE) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  } else if (element.tool === Tool.RECTANGLE) {
    ctx.beginPath();
    const rectangle = new Path2D();
    const width = maxX - minX;
    const height = maxY - minY;
    rectangle.rect(minX, minY, width, height);
    ctx.stroke(rectangle);
    ctx.fill(rectangle);
  } else if (element.tool === Tool.LINE) {
    const numPoints = points.length;
    const fromx = points[0].x;
    const fromy = points[0].y;
    const tox = points[points.length - 1].x;
    const toy = points[points.length - 1].y;

    ctx.save();
    ctx.lineWidth *= 1.5;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    if (element.toolOptions.lineEndStyle === LineEndStyle.ARROW) {
      ctx.beginPath();
      for (let i = points.length - 2; i > 0; i -= 1) {
        const targetPoint = numPoints > 4 && i <= 2 ? points[0] : points[numPoints - 1];
        ctx.moveTo(targetPoint.x, targetPoint.y);
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    } else if (element.toolOptions.lineEndStyle === LineEndStyle.SQUARE) {
      ctx.lineWidth = element.size / 2;
      ctx.beginPath();
      for (let i = 1; i < points.length - 1; i += 2) {
        const startPoint = points[i];
        const endPoint = points[i + 1];
        const width = endPoint.x - startPoint.x;
        const height = endPoint.y - startPoint.y;
        ctx.rect(startPoint.x, startPoint.y, width, height);
      }
      ctx.fill();
      ctx.stroke();
    } else if (element.toolOptions.lineEndStyle === LineEndStyle.CIRCLE) {
      ctx.lineWidth = element.size / 2;
      ctx.beginPath();
      for (let i = 1; i < points.length - 1; i += 2) {
        const startPoint = points[i];
        const endPoint = points[i + 1];
        const centerX = (startPoint.x + endPoint.x) / 2;
        const centerY = (startPoint.y + endPoint.y) / 2;
        const radius =
          Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
          ) / 2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      }
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    if (element.toolOptions.lineEndStyle === LineEndStyle.ARROW) {
      ctx.beginPath();
      for (let i = points.length - 2; i > 0; i -= 1) {
        const targetPoint = numPoints > 4 && i <= 2 ? points[0] : points[numPoints - 1];
        ctx.moveTo(targetPoint.x, targetPoint.y);
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    } else if (element.toolOptions.lineEndStyle === LineEndStyle.SQUARE) {
      ctx.beginPath();
      for (let i = 1; i < points.length - 1; i += 2) {
        const startPoint = points[i];
        const endPoint = points[i + 1];
        const width = endPoint.x - startPoint.x;
        const height = endPoint.y - startPoint.y;
        ctx.rect(startPoint.x, startPoint.y, width, height);
      }
      ctx.fill();
    } else if (element.toolOptions.lineEndStyle === LineEndStyle.CIRCLE) {
      ctx.beginPath();
      for (let i = 1; i < points.length - 1; i += 2) {
        const startPoint = points[i];
        const endPoint = points[i + 1];
        const centerX = (startPoint.x + endPoint.x) / 2;
        const centerY = (startPoint.y + endPoint.y) / 2;
        const radius =
          Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
          ) / 2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      }
      ctx.fill();
    }
    ctx.restore();
  } else if (element.tool === Tool.BLOB || element.tool === Tool.ERASER) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    let i = 0;
    for (i = 0; i < points.length - 2; i += 1) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    if (points.length >= 2) {
      ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }

    if (element.tool === Tool.BLOB) {
      ctx.closePath();
      ctx.save();
      if (isTransparent(element.strokeColor)) {
        ctx.strokeStyle = ctx.fillStyle;
      }
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (element.tool === Tool.ERASER) {
      ctx.save();
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.restore();
    }
  } else if (element.tool === Tool.CUT) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    let i = 0;
    for (i = 0; i < points.length - 2; i += 1) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    if (points.length >= 2) {
      ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }

    if (element.isCompletedCut) {
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    } else {
      ctx.setLineDash([10, 10]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0000ff";
      ctx.stroke();
    }
  } else if (element.tool === Tool.CLEAR_ALL) {
    ctx.beginPath();
    const rectangle = new Path2D();
    const width = maxX - minX;
    const height = maxY - minY;
    rectangle.rect(minX, minY, width, height);
    ctx.fill(rectangle);
  }

  ctx.restore();
}

function clearCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawElements() {
  if (typeof drawingCanvas.value === "undefined") {
    return;
  }

  const ctx = drawingCanvas.value.getContext("2d");
  if (ctx === null) {
    return;
  }
  ctx.setTransform(initTransformMatrix);
  ctx.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height);

  ctx.setTransform(transformMatrix.value);

  const drawElementIds = canvasStore.activeElements;
  for (let i = 0; i < drawElementIds.length; i += 1) {
    const elementId = drawElementIds[i];
    const element = getCanvasElement(elementId);
    drawElement(drawingCanvas.value, element);
  }
}

function getInteractiveElementTransform(element: IInteractiveElement): string {
  const initMatrixA = initTransformMatrix ? initTransformMatrix.a : 1;
  const currMatrixA = transformMatrix.value ? transformMatrix.value.a : 1;
  const currMatrixE = transformMatrix.value ? transformMatrix.value.e : 0;
  const currMatrixF = transformMatrix.value ? transformMatrix.value.f : 0;
  const htmlRelativeZoom = currMatrixA / initMatrixA;
  const newOrigin = {
    x: currMatrixE / initMatrixA,
    y: currMatrixF / initMatrixA,
  };
  const translate = `translate(${
    newOrigin.x + element.style.transform.translate[0] * htmlRelativeZoom
  }px, ${newOrigin.y + element.style.transform.translate[1] * htmlRelativeZoom}px)`;
  const scale = `scale(${element.style.transform.scale[0] * htmlRelativeZoom}, ${
    element.style.transform.scale[1] * htmlRelativeZoom
  })`;
  const rotate = `rotate(${element.style.transform.rotate}deg)`;

  const transformStr = `${translate} ${scale} ${rotate}`;
  return transformStr;
}

function setInteractiveElementTransform(element: IInteractiveElement, transform = {}): string {
  const nextTransform = {
    ...element.style.transform,
    ...transform,
  };

  element.style.transform = nextTransform;
  element.style.transformStr = getInteractiveElementTransform(element);
  return nextTransform;
}

function handleAddCheckbox(pos) {
  const checkboxElement: IInteractiveElement = {
    id: uuidv4(),
    tool: Tool.CHECKBOX,
    toolOptions: {
      isChecked: false,
    } as ICheckboxElementOptions,
    style: {
      transform: {
        translate: [pos.x, pos.y],
        scale: [1, 1],
        rotate: 0,
      },
      transformStr: "",
    },
    points: [pos],
    isHTMLElement: true,
    isDeleted: false,
  };

  setInteractiveElementTransform(checkboxElement as TElement);
  createCanvasElement(checkboxElement);
}

function handleAddTextbox(pos) {
  const textboxElement = {
    id: uuidv4(),
    tool: Tool.TEXTBOX,
    isHTMLElement: true,
    isDeleted: false,
    toolOptions: {
      textContents: null,
    },
    style: {
      transform: {
        translate: [pos.x, pos.y],
        scale: [1, 1],
        rotate: 0,
      },
      transformStr: "",
    },
    points: [pos],
  };

  setInteractiveElementTransform(textboxElement);
  createCanvasElement(textboxElement);
}

function handleClearAll() {
  const lastElementId = canvasStore.lastActiveElementId;
  const lastElement = getCanvasElement(lastElementId);
  if (
    canvasStore.elementOrder.length === 0 ||
    (canvasStore.elementOrder.length > 0 && lastElement.tool === Tool.CLEAR_ALL)
  ) {
    return;
  }

  const clearElement: IClearElement = {
    id: uuidv4(),
    tool: Tool.CLEAR_ALL,
    composition: "destination-out",
    strokeColor: TRANSPARENT_COLOR,
    fillColor: { r: 255, g: 255, b: 255, a: 1 },
    toolOptions: null,
    points: [
      {
        x: 0,
        y: 0,
      },
      {
        x: canvasStore.canvasConfig.width,
        y: canvasStore.canvasConfig.height,
      },
    ],
    dimensions: {},
    isDrawingCached: false,
    isDeleted: false,
    isHTMLElement: false,
    cache: {},
  };
  clearElement.dimensions = calculateDimensions(clearElement as TElement);
  createCanvasElement(clearElement);
  cacheElement(clearElement);
  drawElements();
  canvasStore.selectedTool = Tool.ERASER;
}

async function handlePasteStart() {
  canvasStore.pasteTransform = {
    translate: [0, 0],
    scale: [1, 1],
    rotate: 0,
  };
  canvasStore.isPasteMode = true;
  await nextTick();

  if (typeof pasteLayer.value === "undefined" || typeof pasteCanvas.value === "undefined") {
    return;
  }

  const ctx = pasteCanvas.value.getContext("2d");

  if (ctx === null) {
    return;
  }

  const cutSelectionId = canvasStore.activeElements[canvasStore.activeElements.length - 1];
  const cutSelection = getCanvasElement(cutSelectionId);

  if (!cutSelection.isDrawingCached) {
    cutSelection.isCompletedCut = true;
    cutSelection.composition = "destination-out";
    cacheElement(cutSelection);
  }

  drawElements();

  canvasStore.pasteTransform.translate = [
    cutSelection.cache.drawing.x,
    cutSelection.cache.drawing.y,
  ];
  setPasteTransform(pasteCanvas.value, canvasStore.pasteTransform);

  const dpi = cutSelection.cache.drawing.dpi;
  const width = cutSelection.cache.drawing.width;
  const height = cutSelection.cache.drawing.height;

  pasteCanvas.value.width = width * dpi;
  pasteCanvas.value.height = height * dpi;

  pasteCanvas.value.style.width = `${width}px`;
  pasteCanvas.value.style.height = `${height}px`;
  ctx.scale(dpi, dpi);

  clearCanvas(pasteCanvas.value);
  ctx.translate(-cutSelection.cache.drawing.x, -cutSelection.cache.drawing.y);
  for (let i = 0; i < canvasStore.activeElements.length - 1; i += 1) {
    const elementId = canvasStore.activeElements[i];
    const element = getCanvasElement(elementId);
    drawElement(pasteCanvas.value, element);
  }
  const cutSelectionClip = cloneDeep(cutSelection);
  cutSelectionClip.isDrawingCached = false;
  cutSelectionClip.cache = {};
  cutSelectionClip.composition = "destination-in";
  drawElement(pasteCanvas.value, cutSelectionClip);

  moveablePaste = new Moveable(pasteLayer.value, {
    target: pasteCanvas.value as HTMLElement,
    draggable: true,
    rotatable: true,
    pinchable: true,
    scalable: true,
    keepRatio: true,
  });

  moveablePaste.on("drag", onPasteDrag).on("rotate", onPasteRotate).on("scale", onPasteScale);
}

function cancelPaste() {
  const cutSelectionId = canvasStore.activeElements[canvasStore.activeElements.length - 1];
  deleteCanvasElement(cutSelectionId, false);
  canvasStore.isPasteMode = false;
}

function handlePasteEnd() {
  if (typeof pasteCanvas.value === "undefined") {
    return;
  }

  const cutSelectionId = canvasStore.activeElements[canvasStore.activeElements.length - 1];
  const cutSelection = getCanvasElement(cutSelectionId);
  const moveableRect = moveablePaste.getRect();
  const pasteElement = {
    id: uuidv4(),
    tool: Tool.PASTE,
    composition: getComposition(),
    isDrawingCached: true,
    dimensions: {
      outerMinX: moveableRect.left,
      outerMinY: moveableRect.top,
      outerWidth: moveableRect.width,
      outerHeight: moveableRect.height,
    },
    cache: {
      drawing: {},
    },
  };

  if (
    canvasStore.pasteTransform.rotate === 0 &&
    cutSelection.cache.drawing.x === pasteElement.dimensions.outerMinX &&
    cutSelection.cache.drawing.y === pasteElement.dimensions.outerMinY &&
    cutSelection.cache.drawing.width === pasteElement.dimensions.outerWidth &&
    cutSelection.cache.drawing.height === pasteElement.dimensions.outerHeight
  ) {
    cancelPaste();
    drawElements();
    canvasStore.popHistoryEvent();
    return;
  }

  const pasteCacheCanvas = document.createElement("canvas");
  const ctx = pasteCacheCanvas.getContext("2d");

  if (ctx === null) {
    return;
  }

  const dpi = window.devicePixelRatio;
  const minX = pasteElement.dimensions.outerMinX;
  const minY = pasteElement.dimensions.outerMinY;
  const width = pasteElement.dimensions.outerWidth;
  const height = pasteElement.dimensions.outerHeight;
  const rotRad = (canvasStore.pasteTransform.rotate * Math.PI) / 180;

  const imageWidth = canvasStore.pasteTransform.scale[0] * pasteCanvas.value.offsetWidth;
  const imageHeight = canvasStore.pasteTransform.scale[1] * pasteCanvas.value.offsetHeight;

  pasteCacheCanvas.width = width * dpi;
  pasteCacheCanvas.height = height * dpi;
  pasteCacheCanvas.style.width = `${width}px`;
  pasteCacheCanvas.style.height = `${height}px`;

  const centerX = width / 2;
  const centerY = height / 2;

  ctx.save();
  ctx.scale(dpi, dpi);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotRad);
  ctx.drawImage(pasteCanvas.value, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
  ctx.restore();

  pasteElement.isDrawingCached = true;
  pasteElement.cache.drawing = {
    x: minX,
    y: minY,
    width,
    height,
    dpi,
    canvas: pasteCacheCanvas,
  };

  createCanvasElement(pasteElement);
  drawElements();
  canvasStore.isPasteMode = false;
}

function handlePasteDelete() {
  drawElements();
  canvasStore.isPasteMode = false;
}

async function handleAddImageStart(image, trackHistory = true) {
  let imageWidth = image.width;
  let imageHeight = image.height;
  let scale = 1;
  if (
    image.width > canvasStore.canvasConfig.width ||
    image.height > canvasStore.canvasConfig.height
  ) {
    scale = Math.min(
      canvasStore.canvasConfig.width / image.width,
      canvasStore.canvasConfig.height / image.height
    );
    imageWidth *= scale;
    imageHeight *= scale;
  }

  canvasStore.imageTransform = {
    translate: [
      canvasStore.canvasConfig.width / 2 - imageWidth / 2,
      canvasStore.canvasConfig.height / 2 - imageHeight / 2,
    ],
    scale: [scale, scale],
    rotate: 0,
    clipType: "inset",
    clipStyles: [0, 0, 0, 0],
  };
  canvasStore.isAddImageMode = true;
  await nextTick();

  if (
    typeof imagePreviewCanvas.value === "undefined" ||
    typeof imageBackdropCanvas.value === "undefined"
  ) {
    return;
  }

  const previewCtx = imagePreviewCanvas.value.getContext("2d");
  const backdropCtx = imageBackdropCanvas.value.getContext("2d");

  if (previewCtx === null || backdropCtx === null) {
    return;
  }

  setImageStyles(imagePreviewCanvas.value, canvasStore.imageTransform);

  const dpi = canvasStore.canvasConfig.dpi;
  imagePreviewCanvas.value.width = imageWidth * dpi;
  imagePreviewCanvas.value.height = imageHeight * dpi;
  imagePreviewCanvas.value.style.width = `${imageWidth}px`;
  imagePreviewCanvas.value.style.height = `${imageHeight}px`;
  previewCtx.scale(dpi, dpi);

  imageBackdropCanvas.value.width = imageWidth * dpi;
  imageBackdropCanvas.value.height = imageHeight * dpi;
  imageBackdropCanvas.value.style.width = `${imageWidth}px`;
  imageBackdropCanvas.value.style.height = `${imageHeight}px`;
  backdropCtx.scale(dpi, dpi);

  clearCanvas(imagePreviewCanvas.value);
  previewCtx.drawImage(image, 0, 0, imageWidth, imageHeight);

  clearCanvas(imageBackdropCanvas.value);
  backdropCtx.drawImage(image, 0, 0, imageWidth, imageHeight);

  activeImage.value = image;
  if (trackHistory) {
    canvasStore.addHistoryEvent({
      type: HistoryEvent.ADD_IMAGE_START,
      image,
    });
  }
}

function handleAddImageEnd() {
  if (typeof imagePreviewCanvas.value === "undefined") {
    return;
  }

  const moveableRect = moveableImage.value.getRect();
  const imageElement = {
    id: uuidv4(),
    tool: Tool.IMAGE,
    toolOptions: {
      image: activeImage.value,
    },
    composition: getComposition(),
    isDrawingCached: true,
    dimensions: {
      outerMinX: moveableRect.left,
      outerMinY: moveableRect.top,
      outerWidth: moveableRect.width,
      outerHeight: moveableRect.height,
    },
    cache: {
      drawing: {},
    },
  };

  const imageCacheCanvas = document.createElement("canvas");
  const ctx = imageCacheCanvas.getContext("2d");

  if (ctx === null) {
    return;
  }

  const dpi = canvasStore.canvasConfig.dpi;
  const minX = imageElement.dimensions.outerMinX;
  const minY = imageElement.dimensions.outerMinY;
  const width = imageElement.dimensions.outerWidth;
  const height = imageElement.dimensions.outerHeight;
  const centerX = width / 2;
  const centerY = height / 2;

  imageCacheCanvas.width = width * dpi;
  imageCacheCanvas.height = height * dpi;
  imageCacheCanvas.style.width = `${width}px`;
  imageCacheCanvas.style.height = `${height}px`;

  const rotRad = (canvasStore.imageTransform.rotate * Math.PI) / 180;
  const imageWidth = canvasStore.imageTransform.scale[0] * imagePreviewCanvas.value.offsetWidth;
  const imageHeight = canvasStore.imageTransform.scale[1] * imagePreviewCanvas.value.offsetHeight;
  const clipValues = canvasStore.imageTransform.clipStyles
    .map((value: number | string) =>
      typeof value === "string" ? Number(value.split("px")[0]) : value
    )
    .map((value: number) => (value < 0 ? 0 : value));
  clipValues[0] *= canvasStore.imageTransform.scale[1];
  clipValues[1] *= canvasStore.imageTransform.scale[0];
  clipValues[2] *= canvasStore.imageTransform.scale[1];
  clipValues[3] *= canvasStore.imageTransform.scale[0];
  const clipWidth = imageWidth - clipValues[1] - clipValues[3];
  const clipHeight = imageHeight - clipValues[0] - clipValues[2];

  ctx.save();
  ctx.scale(dpi, dpi);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotRad);
  ctx.beginPath();
  ctx.rect(
    -imageWidth / 2 + clipValues[3],
    -imageHeight / 2 + clipValues[0],
    clipWidth,
    clipHeight
  );
  ctx.clip();
  ctx.fillStyle = "#ff0000";
  ctx.fill();
  ctx.drawImage(
    imagePreviewCanvas.value,
    -imageWidth / 2,
    -imageHeight / 2,
    imageWidth,
    imageHeight
  );
  ctx.restore();

  imageElement.isDrawingCached = true;
  imageElement.cache.drawing = {
    x: minX,
    y: minY,
    width,
    height,
    dpi,
    canvas: imageCacheCanvas,
  };

  createCanvasElement(imageElement);
  drawElements();
  activeImage.value = null;
  canvasStore.isAddImageMode = false;
}

function cancelAddImage() {
  canvasStore.isAddImageMode = false;
}

function setRenderTransforms(matrix: DOMMatrix | null | undefined = null) {
  let relativeZoom = 1;

  if (typeof matrix !== "undefined" && matrix !== null) {
    const initMatrixA = initTransformMatrix ? initTransformMatrix.a : 1;
    relativeZoom = initMatrixA / matrix.a;
    interactiveCanvasTransform.value = `matrix(1, 0, 0, 1, 0, 0)`;
    paperPatternTransform.value.x = matrix.e / initMatrixA;
    paperPatternTransform.value.y = matrix.f / initMatrixA;
  }

  paperPatternTransform.value.lineSize = selectedPatternStyles.value.lineSize / relativeZoom;
  paperPatternTransform.value.spacing = selectedPatternStyles.value.spacing / relativeZoom;
}

function handlePanTransform(event, isStart = false) {
  if (typeof transformMatrix.value === "undefined") {
    return;
  }

  const pos = getMousePos(drawingCanvas.value, event);

  if (isStart) {
    activePanCoords = [
      {
        x: pos.x - transformMatrix.value.e,
        y: pos.y - transformMatrix.value.f,
      },
    ];
  }

  activePanCoords[1] = { x: pos.x, y: pos.y };

  const transformOrigin = {
    x: activePanCoords[1].x - activePanCoords[0].x,
    y: activePanCoords[1].y - activePanCoords[0].y,
  };

  transformMatrix.value.e = transformOrigin.x;
  transformMatrix.value.f = transformOrigin.y;

  setRenderTransforms(transformMatrix.value);
  drawElements();
}

function handleZoomOut() {
  if (typeof transformMatrix.value === "undefined") {
    return;
  }

  if (transformMatrix.value.a > 0.5) {
    transformMatrix.value.a -= 0.1;
    transformMatrix.value.a = Math.round((transformMatrix.value.a + Number.EPSILON) * 100) / 100;
    transformMatrix.value.d = transformMatrix.value.a;
  }

  setRenderTransforms(transformMatrix.value);
  drawElements();
}

function handleZoomIn() {
  if (typeof transformMatrix.value === "undefined") {
    return;
  }

  if (transformMatrix.value.a < 6) {
    transformMatrix.value.a += 0.1;
    transformMatrix.value.a = Math.round((transformMatrix.value.a + Number.EPSILON) * 100) / 100;
    transformMatrix.value.d = transformMatrix.value.a;
  }

  setRenderTransforms(transformMatrix.value);
  drawElements();
}

function closeAllColorPickers() {
  for (let i = 0; i < colorPickerRefs.length; i += 1) {
    colorPickerRefs[i].closeDropdown();
  }
}

function handleCanvasTouchStart(event: Event) {
  closeAllColorPickers();

  if (
    canvasStore.activeElements.length === 0 &&
    (canvasStore.selectedTool === Tool.ERASER || canvasStore.selectedTool === Tool.CUT)
  ) {
    return;
  }

  if (canvasStore.selectedTool === Tool.CHECKBOX || canvasStore.selectedTool === Tool.TEXTBOX) {
    return;
  }

  if (canvasStore.selectedTool === Tool.POINTER) {
    canvasStore.isPanning = true;
    handlePanTransform(event, true);
    return;
  }

  checkIsStylus(event);

  if (!isDrawingAllowed(true) || drawingCanvas.value === null) {
    return;
  }

  canvasStore.isDrawing = true;

  const pos = getDrawPos(drawingCanvas.value, event, true);
  const isRulerLine = pos.isRulerLine;
  const pressure = getPressure(event);
  const opacity = getOpacity();
  const composition = getComposition();
  const size = canvasStore.selectedTool === Tool.CUT ? 0 : canvasStore.selectedToolSize;
  const strokeColor =
    canvasStore.selectedTool === Tool.CUT ? TRANSPARENT_COLOR : canvasStore.selectedStrokeColor;
  const fillColor =
    canvasStore.selectedTool === Tool.CUT ? TRANSPARENT_COLOR : canvasStore.selectedFillColor;

  const newElement: ICanvasElement = {
    id: uuidv4(),
    tool: canvasStore.selectedTool,
    fillColor,
    strokeColor,
    size,
    composition,
    opacity,
    isRulerLine,
    points: [{ x: pos.x, y: pos.y, pressure }],
    toolOptions: {
      lineEndSide: canvasStore.selectedLineEndSide,
      lineEndStyle: canvasStore.selectedLineEndStyle,
    },
    freehandOptions: {
      size: canvasStore.selectedToolSize,
      simulatePressure: canvasStore.selectedTool === Tool.PEN && !canvasStore.isStylus,
      thinning: canvasStore.selectedTool === Tool.PEN ? 0.95 : 0,
      streamline: isRulerLine ? 1 : 0.32,
      smoothing: isRulerLine ? 1 : 0.32,
      last: false,
    },
    smoothPoints: {},
    dimensions: {},
    cache: {},
    isDeleted: false,
    isHTMLElement: false,
    isDrawingCached: false,
  };

  if (
    newElement.tool === Tool.CIRCLE ||
    newElement.tool === Tool.RECTANGLE ||
    newElement.tool === Tool.BLOB ||
    newElement.tool === Tool.ERASER
  ) {
    newElement.points.push({ x: pos.x, y: pos.y, pressure });
  } else if (newElement.tool === Tool.TRIANGLE) {
    newElement.points.push({ x: pos.x, y: pos.y, pressure });
    newElement.points.push({ x: pos.x, y: pos.y, pressure });
  } else if (newElement.tool === Tool.LINE) {
    newElement.points = calculateLinePoints(newElement, pos);
  }

  if (CANVAS_LINE_TOOLS.includes(newElement.tool)) {
    newElement.smoothPoints = getSmoothPoints(newElement);
  }
  newElement.dimensions = calculateDimensions(newElement as TElement);

  createCanvasElement(newElement);
  drawElements();
}

function handleCanvasTouchMove(event: Event) {
  if (!(canvasStore.isPanning || isDrawingAllowed()) || drawingCanvas.value === null) {
    return;
  }

  event.preventDefault();

  if (canvasStore.isPanning) {
    handlePanTransform(event);
    return;
  }

  const lastElementId = canvasStore.elementOrder[canvasStore.elementOrder.length - 1];
  const lastElement = getCanvasElement(lastElementId);
  const followRuler = lastElement.isRulerLine || !CANVAS_LINE_TOOLS.includes(lastElement.tool);
  const pos = getDrawPos(drawingCanvas.value, event, followRuler);
  const pressure = getPressure(event);

  if (lastElement.tool === Tool.CIRCLE || lastElement.tool === Tool.RECTANGLE) {
    lastElement.points[1] = { x: pos.x, y: pos.y, pressure };
  } else if (lastElement.tool === Tool.TRIANGLE) {
    const dx = lastElement.points[0].x - pos.x;
    const dy = lastElement.points[0].y - pos.y;

    const p2 = {
      x: pos.x + dy / 2,
      y: pos.y - dx / 2,
    };

    const p3 = {
      x: pos.x - dy / 2,
      y: pos.y + dx / 2,
    };

    lastElement.points[1] = p2;
    lastElement.points[2] = p3;
  } else if (lastElement.tool === Tool.LINE) {
    lastElement.points = calculateLinePoints(lastElement, pos);
  } else {
    lastElement.points.push({ x: pos.x, y: pos.y, pressure });
  }

  lastElement.isRulerLine = pos.isRulerLine;

  if (CANVAS_LINE_TOOLS.includes(lastElement.tool)) {
    lastElement.smoothPoints = getSmoothPoints(lastElement);
  }

  lastElement.dimensions = calculateDimensions(lastElement);
  drawElements();
}

function handleCanvasTouchEnd(event) {
  if (canvasStore.isInteractiveEditMode || canvasStore.isTextboxEditMode) {
    return;
  }

  if (canvasStore.isPanning) {
    handlePanTransform(event);
    canvasStore.isPanning = false;
    return;
  }

  if (canvasStore.selectedTool === Tool.CHECKBOX) {
    const pos = getDrawPos(drawingCanvas.value, event, true);
    handleAddCheckbox(pos);
    return;
  }

  if (canvasStore.selectedTool === Tool.TEXTBOX) {
    const pos = getDrawPos(drawingCanvas.value, event, true);
    handleAddTextbox(pos);
    return;
  }

  if (!isDrawingAllowed() || drawingCanvas.value === null) {
    return;
  }

  const lastElementId = canvasStore.elementOrder[canvasStore.elementOrder.length - 1];
  const lastElement = getCanvasElement(lastElementId);
  lastElement.freehandOptions.last = true;
  lastElement.dimensions = calculateDimensions(lastElement);

  if (lastElement.dimensions.outerWidth === 0 || lastElement.dimensions.outerHeight === 0) {
    canvasStore.elementOrder.pop();
    canvasStore.isDrawing = false;
    return;
  }

  if (lastElement.tool === Tool.CUT) {
    handlePasteStart();
  } else {
    cacheElement(lastElement);
    drawElements();
  }
  canvasStore.isDrawing = false;
}

function setRulerTransform(target, transform) {
  const nextTransform = {
    ...canvasStore.ruler.transform,
    ...transform,
  };

  const translate = `translate(${nextTransform.translate[0]}px, ${nextTransform.translate[1]}px)`;
  const scale = `scale(${nextTransform.scale[0]}, ${nextTransform.scale[1]})`;
  const rotate = `rotate(${nextTransform.rotate}deg)`;
  target.style.transform = `${translate} ${scale} ${rotate}`;
  canvasStore.ruler.transform = nextTransform;
}

function onRulerMoveStart(e) {
  canvasStore.isMovingRuler = true;
}

function onRulerMoveEnd() {
  canvasStore.isMovingRuler = false;
}

function onRulerDrag({ target, translate }) {
  setRulerTransform(target, { translate });
}

function onRulerRotate({ target, drag, rotation }) {
  const normalizedRotation = rotation % 360;
  const absRotation = Math.abs(normalizedRotation);
  let transformRotation = normalizedRotation;

  const direction = normalizedRotation > 0 ? 1 : -1;
  const snapTargets = [0, 45, 90, 135, 180, 225, 270, 315, 360];
  const snapThreshold = 5;

  for (let i = 0; i < snapTargets.length; i += 1) {
    const target = snapTargets[i];

    if (absRotation < target && absRotation + snapThreshold >= target) {
      transformRotation = target * direction;
      break;
    } else if (absRotation > target && absRotation - snapThreshold <= target) {
      transformRotation = target * direction;
      break;
    }
  }

  setRulerTransform(target, {
    rotate: transformRotation % 360,
    translate: drag.translate,
  });
}

function setPasteTransform(target, transform) {
  const nextTransform = {
    ...canvasStore.pasteTransform,
    ...transform,
  };

  const translate = `translate(${nextTransform.translate[0]}px, ${nextTransform.translate[1]}px)`;
  const scale = `scale(${nextTransform.scale[0]}, ${nextTransform.scale[1]})`;
  const rotate = `rotate(${nextTransform.rotate}deg)`;
  target.style.transform = `${translate} ${scale} ${rotate}`;

  canvasStore.pasteTransform = nextTransform;
}

function onPasteDrag({ target, translate }) {
  setPasteTransform(target, { translate });
}

function onPasteRotate({ target, rotate, drag }) {
  setPasteTransform(target, { rotate, translate: drag.translate });
}

function onPasteScale({ target, scale, drag }) {
  setPasteTransform(target, { scale, translate: drag.translate });
}

function handleImageUpload(e) {
  const file = e.target.files[0];

  const reader = new FileReader();
  reader.onload = function (onloadEvent) {
    if (onloadEvent.target === null || typeof onloadEvent.target.result !== "string") {
      return;
    }

    const img = new Image();
    img.onload = function () {
      handleAddImageStart(img);
    };

    img.src = onloadEvent.target.result;
    e.target.value = null;
  };

  reader.readAsDataURL(file);
}

function setImageStyles(target, transform) {
  if (typeof imagePreviewCanvas.value === "undefined") {
    return;
  }
  const nextTransform = {
    ...canvasStore.imageTransform,
    ...transform,
  };

  const translate = `translate(${nextTransform.translate[0]}px, ${nextTransform.translate[1]}px)`;
  const scale = `scale(${nextTransform.scale[0]}, ${nextTransform.scale[1]})`;
  const rotate = `rotate(${nextTransform.rotate}deg)`;

  imagePreviewCanvas.value.style.transform = `${translate} ${scale} ${rotate}`;
  imagePreviewCanvas.value.style.clipPath = `${
    nextTransform.clipType
  }(${nextTransform.clipStyles.join(" ")})`;

  if (typeof imageBackdropCanvas.value !== "undefined") {
    imageBackdropCanvas.value.style.transform = `${translate} ${scale} ${rotate}`;
  }

  canvasStore.imageTransform = nextTransform;
}

function onImageDrag({ target, translate }) {
  setImageStyles(target, { translate });
}

function onImageRotate({ target, rotate, drag }) {
  setImageStyles(target, { rotate, translate: drag.translate });
}

function onImageScale({ target, scale, drag }) {
  setImageStyles(target, { scale, translate: drag.translate });
}

function onImageClip({ target, clipType, clipStyles }) {
  setImageStyles(target, { clipType, clipStyles });
}

function handleUndoClick() {
  const action = canvasStore.history[canvasStore.historyIndex];
  let redoPaste = false;
  let redoAddImage = false;

  if (canvasStore.isPasteMode) {
    cancelPaste();
  } else if (action.type === HistoryEvent.ADD_IMAGE_START) {
    cancelAddImage();
  } else if (action.type === HistoryEvent.ADD_CANVAS_ELEMENT) {
    const element = getCanvasElement(action.elementId);
    redoPaste = element.tool === Tool.PASTE;
    redoAddImage = element.tool === Tool.IMAGE;
    hideCanvasElement(action.elementId);
  } else if (action.type === HistoryEvent.REMOVE_CANVAS_ELEMENT) {
    showCanvasElement(action.elementId);
  } else if (action.type === HistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES) {
    const element = getCanvasElement(action.elementId);
    element.style = cloneDeep(action.from);
  }

  canvasStore.historyIndex -= 1;

  if (redoPaste) {
    handlePasteStart();
  } else if (redoAddImage) {
    drawElements();
    handleAddImageStart(action.image, false);
  } else {
    drawElements();
  }
}

function handleRedoClick() {
  const action = canvasStore.history[canvasStore.historyIndex + 1];
  let redoPaste = false;
  let redoAddImage = false;

  if (action.type === HistoryEvent.ADD_CANVAS_ELEMENT) {
    const element = getCanvasElement(action.elementId);
    redoPaste = element.tool === Tool.CUT;
    showCanvasElement(action.elementId);
  } else if (action.type === HistoryEvent.REMOVE_CANVAS_ELEMENT) {
    hideCanvasElement(action.elementId);
  } else if (action.type === HistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES) {
    const element = getCanvasElement(action.elementId);
    element.style = cloneDeep(action.to);
  } else if (action.type === HistoryEvent.ADD_IMAGE_START) {
    redoAddImage = true;
  }

  canvasStore.historyIndex += 1;

  if (redoPaste) {
    handlePasteStart();
  } else if (redoAddImage) {
    handleAddImageStart(action.image, false);
  } else {
    canvasStore.isPasteMode = false;
    canvasStore.isAddImageMode = false;
    drawElements();
  }
}

let selectoInteractive, moveableInteractive;
let moveableElements: any[] = [];
function handleStartInteractiveEdit() {
  canvasStore.isInteractiveEditMode = true;
  activeTextbox.value = null;
  moveableElements = [];
  selectoInteractive = new Selecto({
    container: interactiveCanvas.value,
    selectableTargets: [".interactiveElement"],
    selectByClick: true,
    selectFromInside: false,
    continueSelect: false,
    toggleContinueSelect: "shift",
    hitRate: 0,
  });

  moveableInteractive = new Moveable(interactiveCanvas.value, {
    draggable: true,
    rotatable: true,
    pinchable: true,
  });

  moveableInteractive
    .on("renderStart", ({ target }) => {
      handleInteractiveStart(target);
    })
    .on("renderGroupStart", (e) => {
      e.targets.forEach(handleInteractiveStart);
    })
    .on("clickGroup", (e) => {
      selectoInteractive.clickTarget(e.inputEvent, e.inputTarget);
    })
    .on("drag", handleInteractiveDrag)
    .on("dragGroup", (e) => {
      e.events.forEach(handleInteractiveDrag);
    })
    .on("rotate", handleInteractiveRotate)
    .on("rotateGroup", (e) => {
      e.events.forEach(handleInteractiveRotate);
    })
    .on("renderEnd", ({ target }) => {
      handleInteractiveEnd(target);
    })
    .on("renderGroupEnd", (e) => {
      e.targets.forEach(handleInteractiveEnd);
    });

  selectoInteractive
    .on("dragStart", (e) => {
      const target = e.inputEvent.target;
      if (
        moveableInteractive.isMoveableElement(target) ||
        moveableElements.some((t) => t === target || t.contains(target))
      ) {
        e.stop();
      }
    })
    .on("select", (e) => {
      moveableElements = e.selected;
      moveableInteractive.target = moveableElements;
    })
    .on("selectEnd", (e) => {
      if (e.isDragStart) {
        e.inputEvent.preventDefault();

        setTimeout(() => {
          moveableInteractive.dragStart(e.inputEvent);
        });
      }
    });
}

function handleEndInteractiveEdit() {
  canvasStore.isInteractiveEditMode = false;
  selectoInteractive.destroy();
  moveableInteractive.destroy();
}

function setInteractiveElementStyles(target, transform) {
  const elementId = target.getAttribute("data-element-id");
  const element = getCanvasElement(elementId);

  setInteractiveElementTransform(element, transform);
  target.style.transform = element.style.transformStr;
}

function handleInteractiveDrag({ target, translate }) {
  setInteractiveElementStyles(target, { translate });
}

function handleInteractiveRotate({ target, rotate, drag }) {
  setInteractiveElementStyles(target, { rotate, translate: drag.translate });
}

function handleInteractiveStart(target) {
  const elementId = target.getAttribute("data-element-id");
  const element = getCanvasElement(elementId);
  element.tmpFromStyle = cloneDeep(element.style);
}

function handleInteractiveEnd(target) {
  const elementId = target.getAttribute("data-element-id");
  const element = getCanvasElement(elementId);
  canvasStore.addHistoryEvent({
    type: HistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES,
    elementId: element.id,
    to: cloneDeep(element.style),
    from: cloneDeep(element.tmpFromStyle),
  });

  delete element.tmpFromStyle;
}

function handleTextboxChange({ elementId, textContents }) {
  const element = getCanvasElement(elementId);
  (element.toolOptions as ITextboxElementOptions).textContents = textContents;
}

function handleTextboxFocus({ elementId }) {
  if (canvasStore.isDrawing) {
    return;
  }

  canvasStore.isTextboxEditMode = true;
  canvasStore.selectedTool = Tool.TEXTBOX;
  activeTextbox.value = elementId;
}

function handleTextboxBlur() {
  canvasStore.isTextboxEditMode = false;
}

function handleInteractiveElementEvent(e) {
  if (!canvasStore.isInteractiveEditMode && !canvasStore.isDrawing) {
    e.stopPropagation();
  }
}

function handleElementDelete() {
  for (let i = 0; i < moveableElements.length; i += 1) {
    const elementId = moveableElements[i].getAttribute("data-element-id");
    deleteCanvasElement(elementId);
  }
  moveableElements = [];
  moveableInteractive.target = [];
}

function getColorAsCss(color) {
  if (color === TRANSPARENT_COLOR) {
    return TRANSPARENT_COLOR;
  }

  if (Array.isArray(color)) {
    const gradientStops = [];
    for (let i = 0; i < color.length; i += 1) {
      const colorStop = getColorAsCss(color[i].color);
      const percent = color[i].percent;
      gradientStops.push(`${colorStop} ${percent}%`);
    }

    return `linear-gradient(135deg, ${gradientStops.join(", ")})`;
  }

  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

function handleFillColorChange(swatchId: string, colorIdx: number) {
  canvasStore.selectedFillSwatchId = swatchId;
  canvasStore.selectedFillColorIdx = colorIdx;
}

function handleStrokeColorChange(swatchId: string, colorIdx: number) {
  canvasStore.selectedStrokeSwatchId = swatchId;
  canvasStore.selectedStrokeColorIdx = colorIdx;
}

function handlePaperColorChange(swatchId: string, colorIdx: number) {
  canvasStore.selectedPaperSwatchId = swatchId;
  canvasStore.selectedPaperColorIdx = colorIdx;
}

function handlePatternColorChange(swatchId: string, colorIdx: number) {
  canvasStore.selectedPatternSwatchId = swatchId;
  canvasStore.selectedPatternColorIdx = colorIdx;
}
</script>

<template>
  <div class="canvas-wrapper">
    <!-- START TOOLS -->
    <div class="tools">
      <select v-model.number="canvasStore.selectedTool" @change="handleToolChange">
        <option v-for="tool in supportedTools" :key="tool.key" :value="tool.key">
          {{ tool.label }}
        </option>
      </select>
      <div v-if="canvasStore.selectedTool === Tool.LINE">
        <select v-model="canvasStore.selectedLineEndSide">
          <option v-for="endSide in LINE_END_SIDE_CHOICES" :key="endSide.key" :value="endSide.key">
            {{ endSide.label }}
          </option>
        </select>
        <select v-model="canvasStore.selectedLineEndStyle">
          <option
            v-for="endStyle in LINE_END_STYLE_CHOICES"
            :key="endStyle.key"
            :value="endStyle.key"
          >
            {{ endStyle.label }}
          </option>
        </select>
      </div>
      <label v-else-if="canvasStore.selectedTool === Tool.IMAGE">
        <input type="file" accept="image/*" @change="handleImageUpload" />
      </label>
      <label
        v-else-if="
          (canvasStore.selectedTool === Tool.CHECKBOX ||
            canvasStore.selectedTool === Tool.TEXTBOX) &&
          !canvasStore.isInteractiveEditMode
        "
      >
        <button @click="handleStartInteractiveEdit">Edit</button>
      </label>

      <button v-if="canvasStore.isAddImageMode" @click="handleAddImageEnd">Done</button>
      <button v-if="canvasStore.isPasteMode" @click="handlePasteEnd">Done</button>
      <button v-if="canvasStore.isPasteMode" @click="handlePasteDelete">Delete Selection</button>
      <div v-if="canvasStore.isInteractiveEditMode">
        <button @click="handleElementDelete">Delete</button>
        <button @click="handleEndInteractiveEdit">Done</button>
      </div>
      <select v-if="canvasStore.isDrawingTool" v-model="canvasStore.selectedToolSize">
        <option v-for="size in PEN_SIZES" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
      <ColorPicker
        v-if="canvasStore.isDrawingTool"
        style="display: inline"
        :ref="addColorPickerRef"
        :swatchId="canvasStore.selectedFillSwatchId"
        :colorIdx="canvasStore.selectedFillColorIdx"
        :specialSwatchKey="SPECIAL_TOOL_SWATCH_KEY"
        @update="handleFillColorChange"
      />
      <ColorPicker
        v-if="canvasStore.isDrawingTool"
        style="display: inline"
        :ref="addColorPickerRef"
        :swatchId="canvasStore.selectedStrokeSwatchId"
        :colorIdx="canvasStore.selectedStrokeColorIdx"
        :specialSwatchKey="SPECIAL_TOOL_SWATCH_KEY"
        @update="handleStrokeColorChange"
      />
      <select v-if="canvasStore.isPaperTool" v-model="selectedPaperPatternIdx">
        <option v-for="(pattern, index) in paperPatterns" :key="index" :value="index">
          {{ pattern.LABEL }}
        </option>
      </select>
      <ColorPicker
        v-if="canvasStore.isPaperTool"
        style="display: inline"
        :ref="addColorPickerRef"
        :swatchId="canvasStore.selectedPaperSwatchId"
        :colorIdx="canvasStore.selectedPaperColorIdx"
        :specialSwatchKey="SPECIAL_PAPER_SWATCH_KEY"
        @update="handlePaperColorChange"
      />
      <ColorPicker
        v-if="canvasStore.isPaperTool"
        style="display: inline"
        :ref="addColorPickerRef"
        :swatchId="canvasStore.selectedPatternSwatchId"
        :colorIdx="canvasStore.selectedPatternColorIdx"
        :specialSwatchKey="SPECIAL_PAPER_SWATCH_KEY"
        @update="handlePatternColorChange"
      />
      <input
        v-if="canvasStore.isPaperTool"
        type="number"
        min="0"
        max="100"
        step="1"
        v-model="canvasStore.selectedPatternOpacity"
      />
      <input
        v-if="canvasStore.isPaperTool"
        type="number"
        min="0"
        max="512"
        step="1"
        v-model="selectedPatternStyles.lineSize"
      />
      <input
        v-if="canvasStore.isPaperTool"
        type="number"
        min="0"
        max="512"
        step="1"
        v-model="selectedPatternStyles.spacing"
      />

      <label><input type="checkbox" v-model="canvasStore.ruler.isVisible" /> Show Ruler?</label>
      <label
        ><input type="checkbox" v-model="canvasStore.detectedStylus" :disabled="true" /> Detected
        Stylus?</label
      >
      <label
        ><input type="checkbox" v-model="canvasStore.isStylus" :disabled="true" />
        canvasStore.isStylus?</label
      >
      <label><input type="checkbox" v-model="canvasStore.allowFingerDrawing" /> finger?</label>
      <label><input type="checkbox" v-model="canvasStore.debugMode" /> debug?</label>
      <button @click="handleZoomOut">Zoom -</button>
      <button @click="handleZoomIn">Zoom +</button>
      <button :disabled="!canvasStore.hasUndo" @click="handleUndoClick">Undo</button>
      <button :disabled="!canvasStore.hasRedo" @click="handleRedoClick">Redo</button>
    </div>
    <!-- END TOOLS -->
    <div
      class="surface"
      @mousedown="handleCanvasTouchStart"
      @touchstart="handleCanvasTouchStart"
      @mouseup="handleCanvasTouchEnd"
      @touchend="handleCanvasTouchEnd"
      @mousemove="handleCanvasTouchMove"
      @touchmove="handleCanvasTouchMove"
    >
      <div
        class="ruler-layer"
        v-if="canvasStore.ruler.isVisible"
        :class="{ 'hide-ruler-controls': !canvasStore.showRulerControls }"
      >
        <div class="ruler" ref="rulerElement" :style="{ width: canvasStore.ruler.width + 'px' }">
          <div class="ruler__label">
            {{ Math.round(canvasStore.ruler.transform.rotate) }}&deg;
            <span v-if="canvasStore.elementOrder.length > 0 && canvasStore.isDrawing">
              <span
                v-if="canvasStore.elements[canvasStore.lastActiveElementId].dimensions.lineLength"
              >
                {{
                  Math.round(
                    canvasStore.elements[canvasStore.lastActiveElementId].dimensions.lineLength
                  )
                }}px
              </span>
              <span v-else>
                {{
                  Math.round(
                    canvasStore.elements[canvasStore.lastActiveElementId].dimensions.outerWidth
                  )
                }}
                x
                {{
                  Math.round(
                    canvasStore.elements[canvasStore.lastActiveElementId].dimensions.outerHeight
                  )
                }}
              </span>
            </span>
          </div>
          <div class="ruler__tool" :style="{ width: canvasStore.ruler.width + 'px' }"></div>
        </div>
        <MoveableVue
          ref="moveableRuler"
          v-if="canvasStore.ruler.isVisible"
          className="moveable-ruler"
          :target="['.ruler']"
          :pinchable="['rotatable']"
          :draggable="!canvasStore.isDrawing"
          :rotatable="!canvasStore.isDrawing"
          :scalable="false"
          :throttleRotate="1"
          @drag="onRulerDrag"
          @rotate="onRulerRotate"
          @renderStart="onRulerMoveStart"
          @renderEnd="onRulerMoveEnd"
        />
      </div>

      <div class="image-layer" v-if="canvasStore.isAddImageMode">
        <div class="image-canvases">
          <canvas class="image-canvas image-canvas--preview" ref="imagePreviewCanvas"></canvas>
          <canvas class="image-canvas image-canvas--backdrop" ref="imageBackdropCanvas"></canvas>
        </div>
        <MoveableVue
          ref="moveableImage"
          className="moveable-image"
          :target="['.image-canvas--preview']"
          :pinchable="true"
          :draggable="true"
          :rotatable="true"
          :scalable="true"
          :clippable="true"
          :clipTargetBounds="true"
          :keepRatio="true"
          @drag="onImageDrag"
          @rotate="onImageRotate"
          @scale="onImageScale"
          @clip="onImageClip"
        />
      </div>

      <div class="paste-layer" v-if="canvasStore.isPasteMode" ref="pasteLayer">
        <canvas class="paste-canvas" ref="pasteCanvas"></canvas>
      </div>

      <div class="drawing-layer">
        <div
          ref="interactiveCanvas"
          class="interactive-canvas"
          :style="{
            width: canvasStore.canvasConfig.width + 'px',
            height: canvasStore.canvasConfig.height + 'px',
            transform: interactiveCanvasTransform,
          }"
        >
          <template v-for="(elementId, index) in canvasStore.activeHtmlElements" :key="index">
            <input
              v-if="canvasStore.elements[elementId].tool === Tool.CHECKBOX"
              class="interactiveElement"
              v-model="(canvasStore.elements[elementId].toolOptions as ICheckboxElementOptions).isChecked"
              :data-element-id="canvasStore.elements[elementId].id"
              type="checkbox"
              :style="{
                position: 'absolute',
                transform: getInteractiveElementTransform(canvasStore.elements[elementId]),
              }"
              @mousedown="handleInteractiveElementEvent"
              @touchstart="handleInteractiveElementEvent"
              @mouseup="handleInteractiveElementEvent"
              @touchend="handleInteractiveElementEvent"
              @mousemove="handleInteractiveElementEvent"
              @touchmove="handleInteractiveElementEvent"
            />
            <Ftextarea
              v-else-if="canvasStore.elements[elementId].tool === Tool.TEXTBOX"
              :data-element-id="canvasStore.elements[elementId].id"
              class="interactiveElement"
              :style="{
                position: 'absolute',
                transform: getInteractiveElementTransform(canvasStore.elements[elementId]),
              }"
              :element="canvasStore.elements[elementId]"
              :is-active="canvasStore.elements[elementId].id === activeTextbox"
              :colorSwatches="canvasStore.swatches"
              @change="handleTextboxChange"
              @focus="handleTextboxFocus"
              @blur="handleTextboxBlur"
              @mousedown="handleInteractiveElementEvent"
              @touchstart="handleInteractiveElementEvent"
              @mouseup="handleInteractiveElementEvent"
              @touchend="handleInteractiveElementEvent"
              @mousemove="handleInteractiveElementEvent"
              @touchmove="handleInteractiveElementEvent"
            />
          </template>
        </div>
        <canvas
          class="drawing-canvas"
          ref="drawingCanvas"
          :width="canvasStore.canvasConfig.width"
          :height="canvasStore.canvasConfig.height"
        >
        </canvas>
      </div>

      <div class="paper-layer">
        <div
          class="paper-color"
          :style="{ background: getColorAsCss(canvasStore.selectedPaperColor) }"
        ></div>
        <svg class="paper-pattern" width="100%" height="100%">
          <component
            id="paper-svg-pattern"
            :is="selectedPaperPattern.COMPONENT"
            :fillColor="getColorAsCss(canvasStore.selectedPatternColor)"
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
            :opacity="canvasStore.selectedPatternOpacity / 100"
          ></rect>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-wrapper {
  display: block;
  /* position: absoulute; */
  width: 100vw;
  height: 100vh;
  border: 2px solid red;
}

.tools {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 8000;
}

.surface {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}

.drawing-layer,
.paste-layer,
.image-layer,
.ruler-layer,
.paper-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}

.paper-layer {
  z-index: 0;
}

.drawing-layer {
  z-index: 1;
}

.paste-layer {
  z-index: 2;
}

.image-layer {
  z-index: 2;
}

.ruler-layer {
  z-index: 3;
}

.drawing-layer .drawing-canvas,
.drawing-layer .interactive-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.drawing-layer .drawing-canvas {
  z-index: 0;
}

.drawing-layer .interactive-canvas {
  z-index: 1;
}

.image-layer .image-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.image-layer .image-canvas--preview {
  z-index: 1;
}

.image-layer .image-canvas--backdrop {
  z-index: 0;
  opacity: 0.5;
}

.ruler-layer .ruler {
  position: fixed;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  top: 50%;
  left: -5%;
  transform-origin: center center;
  transform: translate(0, 0) rotate(0deg);
}

.ruler-layer .ruler__label {
  position: absolute;
  z-index: 1;
}

.ruler-layer .ruler__tool {
  height: 100px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.5);
  background: linear-gradient(to right, rgba(255, 0, 0, 0.5) 0%, rgba(0, 0, 255, 0.5) 100%);
}

.paper-layer .paper-color {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>

<style>
.hide-ruler-controls .moveable-ruler.moveable-control-box .moveable-rotation {
  display: none;
}

.moveable-image.moveable-control-box .moveable-control.moveable-direction.moveable-nw,
.moveable-image.moveable-control-box .moveable-control.moveable-direction.moveable-ne,
.moveable-image.moveable-control-box .moveable-control.moveable-direction.moveable-sw,
.moveable-image.moveable-control-box .moveable-control.moveable-direction.moveable-se {
  z-index: 20;
}

.moveable-ruler.moveable-control-box .moveable-control.moveable-rotation-control {
  width: 30px;
  height: 30px;
  margin-top: -15px;
  margin-left: -15px;
}

.moveable-control-box .moveable-control.moveable-origin {
  display: none;
}
</style>
