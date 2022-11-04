<script setup lang="ts">
import { ref, computed, watch, watchEffect, watchPostEffect, onMounted, nextTick } from "vue";
import { v4 as uuidv4 } from "uuid";
import cloneDeep from "lodash/cloneDeep";
import Moveable from "moveable";
import Selecto from "selecto";
import MoveableVue from "vue3-moveable";
import Ftextarea from "./CanvasTextarea.vue";

import { useCanvasStore } from "@/stores/canvas";
import {
  PageHistoryEvent as HistoryEvent,
  CanvasTool as Tool,
  CANVAS_TOOL_CHOICES as supportedTools,
  CANVAS_LINE_TOOLS,
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
  IElementPoint,
  IInteractiveElement,
  ITextboxElementOptions,
  TElement,
  TPrimaryKey,
} from "@/types/core";
import { isTransparent, formatColor } from "@/utils/color";
import CheckboxElement from "@/models/CheckboxElement";

console.log("Updated CanvasScene");
const props = defineProps<{ pageId: TPrimaryKey }>();
const canvasStore = useCanvasStore();

const sceneStore = computed(() => canvasStore.scenes[props.pageId]);

const activeTextbox = ref(null);
const activeImage = ref(null);
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
const colorPickerRefs: any[] = [];

const selectedPaperColor = computed(() => {
  return canvasStore.getSwatchColor(
    sceneStore.value.selectedPaperSwatchId,
    sceneStore.value.selectedPaperColorIdx
  );
});

const selectedPatternComponent = computed(() => {
  return canvasStore.getPaperPatternComponentByIdx(sceneStore.value.selectedPaperPatternIdx);
});

const selectedPatternStyles = computed(() => {
  return canvasStore.getPaperPatternPropsByIdx(sceneStore.value.selectedPaperPatternIdx);
});

const selectedPatternColor = computed(() => {
  return canvasStore.getSwatchColor(
    sceneStore.value.selectedPatternSwatchId,
    sceneStore.value.selectedPatternColorIdx
  );
});

const selectedFillColor = computed(() => {
  return canvasStore.getSwatchColor(
    sceneStore.value.selectedFillSwatchId,
    sceneStore.value.selectedFillColorIdx
  );
});

const selectedStrokeColor = computed(() => {
  return canvasStore.getSwatchColor(
    sceneStore.value.selectedStrokeSwatchId,
    sceneStore.value.selectedStrokeColorIdx
  );
});

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

  canvasStore.setupSceneStore(props.pageId, ctx.getTransform());

  watch(
    () => (sceneStore.value ? sceneStore.value.debugMode : false),
    () => {
      drawElements();
    }
  );

  watchPostEffect(() => {
    if (sceneStore.value?.ruler.isVisible) {
      setRulerTransform(rulerElement.value, {});
    }
  });

  watchEffect(() => {
    setRenderTransforms(sceneStore.value?.transformMatrix);
  });
});

function addColorPickerRef(ref: any) {
  if (ref !== null) {
    colorPickerRefs.push(ref);
  }
}

function handleToolChange(event) {
  if (sceneStore.value.selectedTool === Tool.CLEAR_ALL) {
    handleClearAll();
  }

  sceneStore.value.isTextboxEditMode = false;
  activeTextbox.value = null;

  event.target.blur();
}

function isDrawingAllowed(isDrawingOverride = false) {
  const activelyDrawing = sceneStore.value.isDrawing || isDrawingOverride;
  return !canvasStore.isSwatchOpen && sceneStore.value.isDrawingAllowed && activelyDrawing;
}

function getMousePos(canvas, event, followRuler = false) {
  const rect = canvas.getBoundingClientRect(); // abs. size of element
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  let inputX = clientX;
  let inputY = clientY;
  let isRulerLine = false;

  if (followRuler && sceneStore.value.ruler.isVisible && moveableRuler.value) {
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
  let cameraX = sceneStore.value.transformMatrix ? sceneStore.value.transformMatrix.e : 0;
  let cameraY = sceneStore.value.transformMatrix ? sceneStore.value.transformMatrix.f : 0;
  const cameraZoom = sceneStore.value.transformMatrix ? sceneStore.value.transformMatrix.a : 1;
  const initMatrixA = sceneStore.value.initTransformMatrix
    ? sceneStore.value.initTransformMatrix.a
    : 1;
  const relativeZoom = initMatrixA / cameraZoom;

  if (sceneStore.value.isInteractiveTool) {
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

function cacheElement(elementId) {
  const element = sceneStore.value.elementById(elementId);
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

    if (sceneStore.value.debugMode) {
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
    const strokeData = sceneStore.value.getSvgPathFromStroke(strokePoints);
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
    const pathData = sceneStore.value.getSvgPathFromStroke(pathPoints);
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
  ctx.setTransform(sceneStore.value.initTransformMatrix);
  ctx.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height);

  ctx.setTransform(sceneStore.value.transformMatrix);

  const drawElementIds = sceneStore.value.activeElements;
  for (let i = 0; i < drawElementIds.length; i += 1) {
    const elementId = drawElementIds[i];
    const element = sceneStore.value.elementById(elementId);
    drawElement(drawingCanvas.value, element);
  }
}

// function getInteractiveElementTransform(element: IInteractiveElement): string {
//   const initMatrixA = sceneStore.initTransformMatrix ? sceneStore.initTransformMatrix.a : 1;
//   const currMatrixA = sceneStore.transformMatrix ? sceneStore.transformMatrix.a : 1;
//   const currMatrixE = sceneStore.transformMatrix ? sceneStore.transformMatrix.e : 0;
//   const currMatrixF = sceneStore.transformMatrix ? sceneStore.transformMatrix.f : 0;
//   const htmlRelativeZoom = currMatrixA / initMatrixA;
//   const newOrigin = {
//     x: currMatrixE / initMatrixA,
//     y: currMatrixF / initMatrixA,
//   };
//   const translate = `translate(${
//     newOrigin.x + element.style.transform.translate[0] * htmlRelativeZoom
//   }px, ${newOrigin.y + element.style.transform.translate[1] * htmlRelativeZoom}px)`;
//   const scale = `scale(${element.style.transform.scale[0] * htmlRelativeZoom}, ${
//     element.style.transform.scale[1] * htmlRelativeZoom
//   })`;
//   const rotate = `rotate(${element.style.transform.rotate}deg)`;

//   const transformStr = `${translate} ${scale} ${rotate}`;
//   return transformStr;
// }

// function setInteractiveElementTransform(element: IInteractiveElement, transform = {}): string {
//   const nextTransform = {
//     ...element.style.transform,
//     ...transform,
//   };

//   element.style.transform = nextTransform;
//   element.style.transformStr = getInteractiveElementTransform(element);
//   return nextTransform;
// }

function handleAddCheckbox(pos: IElementPoint) {
  const checkboxElement = new CheckboxElement(pos);

  checkboxElement.setInteractiveElementTransform(
    sceneStore.value.initTransformMatrix,
    sceneStore.value.transformMatrix
  );
  sceneStore.value.createElement(checkboxElement as TElement);
}

function handleAddTextbox(pos) {
  const textboxElement: IInteractiveElement = {
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
  sceneStore.value.createElement(textboxElement as TElement);
}

function handleClearAll() {
  const lastElementId = sceneStore.value.lastActiveElementId;
  const lastElement = sceneStore.value.elementById(lastElementId);
  if (
    sceneStore.value.elementOrder.length === 0 ||
    (sceneStore.value.elementOrder.length > 0 && lastElement.tool === Tool.CLEAR_ALL)
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
  clearElement.dimensions = sceneStore.value.calculateDimensions(clearElement as TElement);
  sceneStore.value.createElement(clearElement as TElement);
  cacheElement(clearElement.id);
  drawElements();
  sceneStore.value.selectedTool = Tool.ERASER;
}

async function handlePasteStart() {
  sceneStore.value.pasteTransform = {
    translate: [0, 0],
    scale: [1, 1],
    rotate: 0,
  };
  sceneStore.value.isPasteMode = true;
  await nextTick();

  if (typeof pasteLayer.value === "undefined" || typeof pasteCanvas.value === "undefined") {
    return;
  }

  const ctx = pasteCanvas.value.getContext("2d");

  if (ctx === null) {
    return;
  }

  const cutSelectionId =
    sceneStore.value.activeElements[sceneStore.value.activeElements.length - 1];
  const cutSelection = sceneStore.value.elementById(cutSelectionId);

  if (!cutSelection.isDrawingCached) {
    cutSelection.isCompletedCut = true;
    cutSelection.composition = "destination-out";
    cacheElement(cutSelectionId);
  }

  drawElements();

  sceneStore.value.pasteTransform.translate = [
    cutSelection.cache.drawing.x,
    cutSelection.cache.drawing.y,
  ];
  setPasteTransform(pasteCanvas.value, sceneStore.value.pasteTransform);

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
  for (let i = 0; i < sceneStore.value.activeElements.length - 1; i += 1) {
    const elementId = sceneStore.value.activeElements[i];
    const element = sceneStore.value.elementById(elementId);
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
  const cutSelectionId =
    sceneStore.value.activeElements[sceneStore.value.activeElements.length - 1];
  sceneStore.value.deleteElement(cutSelectionId, false);
  sceneStore.value.isPasteMode = false;
}

function handlePasteEnd() {
  if (typeof pasteCanvas.value === "undefined") {
    return;
  }

  const cutSelectionId =
    sceneStore.value.activeElements[sceneStore.value.activeElements.length - 1];
  const cutSelection = sceneStore.value.elementById(cutSelectionId);
  const moveableRect = moveablePaste.getRect();
  const pasteElement = {
    id: uuidv4(),
    tool: Tool.PASTE,
    composition: sceneStore.value.getComposition(),
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
    sceneStore.value.pasteTransform.rotate === 0 &&
    cutSelection.cache.drawing.x === pasteElement.dimensions.outerMinX &&
    cutSelection.cache.drawing.y === pasteElement.dimensions.outerMinY &&
    cutSelection.cache.drawing.width === pasteElement.dimensions.outerWidth &&
    cutSelection.cache.drawing.height === pasteElement.dimensions.outerHeight
  ) {
    cancelPaste();
    drawElements();
    sceneStore.value.popHistoryEvent();
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
  const rotRad = (sceneStore.value.pasteTransform.rotate * Math.PI) / 180;

  const imageWidth = sceneStore.value.pasteTransform.scale[0] * pasteCanvas.value.offsetWidth;
  const imageHeight = sceneStore.value.pasteTransform.scale[1] * pasteCanvas.value.offsetHeight;

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

  sceneStore.value.createElement(pasteElement as TElement);
  drawElements();
  sceneStore.value.isPasteMode = false;
}

function handlePasteDelete() {
  drawElements();
  sceneStore.value.isPasteMode = false;
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

  sceneStore.value.imageTransform = {
    translate: [
      canvasStore.canvasConfig.width / 2 - imageWidth / 2,
      canvasStore.canvasConfig.height / 2 - imageHeight / 2,
    ],
    scale: [scale, scale],
    rotate: 0,
    clipType: "inset",
    clipStyles: [0, 0, 0, 0],
  };
  sceneStore.value.isAddImageMode = true;
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

  setImageStyles(imagePreviewCanvas.value, sceneStore.value.imageTransform);

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
    sceneStore.value.addHistoryEvent({
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
    composition: sceneStore.value.getComposition(),
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

  const rotRad = (sceneStore.value.imageTransform.rotate * Math.PI) / 180;
  const imageWidth =
    sceneStore.value.imageTransform.scale[0] * imagePreviewCanvas.value.offsetWidth;
  const imageHeight =
    sceneStore.value.imageTransform.scale[1] * imagePreviewCanvas.value.offsetHeight;
  const clipValues = sceneStore.value.imageTransform.clipStyles
    .map((value: number | string) =>
      typeof value === "string" ? Number(value.split("px")[0]) : value
    )
    .map((value: number) => (value < 0 ? 0 : value));
  clipValues[0] *= sceneStore.value.imageTransform.scale[1];
  clipValues[1] *= sceneStore.value.imageTransform.scale[0];
  clipValues[2] *= sceneStore.value.imageTransform.scale[1];
  clipValues[3] *= sceneStore.value.imageTransform.scale[0];
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

  sceneStore.value.createElement(imageElement as TElement);
  drawElements();
  activeImage.value = null;
  sceneStore.value.isAddImageMode = false;
}

function cancelAddImage() {
  sceneStore.value.isAddImageMode = false;
}

function setRenderTransforms(matrix: DOMMatrix | null | undefined = null) {
  let relativeZoom = 1;

  if (typeof matrix !== "undefined" && matrix !== null) {
    const initMatrixA = sceneStore.value.initTransformMatrix
      ? sceneStore.value.initTransformMatrix.a
      : 1;
    relativeZoom = initMatrixA / matrix.a;
    sceneStore.value.paperPatternTransform.x = matrix.e / initMatrixA;
    sceneStore.value.paperPatternTransform.y = matrix.f / initMatrixA;
  }

  sceneStore.value.paperPatternTransform.lineSize =
    selectedPatternStyles.value.lineSize / relativeZoom;
  sceneStore.value.paperPatternTransform.spacing =
    selectedPatternStyles.value.spacing / relativeZoom;
}

function handlePanTransform(event, isStart = false) {
  if (typeof sceneStore.value.transformMatrix === "undefined") {
    return;
  }

  const pos = getMousePos(drawingCanvas.value, event);

  if (isStart) {
    sceneStore.value.activePanCoords = [
      {
        x: pos.x - sceneStore.value.transformMatrix.e,
        y: pos.y - sceneStore.value.transformMatrix.f,
      },
    ];
  }

  sceneStore.value.activePanCoords[1] = { x: pos.x, y: pos.y };

  const transformOrigin = {
    x: sceneStore.value.activePanCoords[1].x - sceneStore.value.activePanCoords[0].x,
    y: sceneStore.value.activePanCoords[1].y - sceneStore.value.activePanCoords[0].y,
  };

  sceneStore.value.transformMatrix.e = transformOrigin.x;
  sceneStore.value.transformMatrix.f = transformOrigin.y;

  setRenderTransforms(sceneStore.value.transformMatrix);
  drawElements();
}

function handleZoomOut() {
  if (typeof sceneStore.value.transformMatrix === "undefined") {
    return;
  }

  if (sceneStore.value.transformMatrix.a > 0.5) {
    sceneStore.value.transformMatrix.a -= 0.1;
    sceneStore.value.transformMatrix.a =
      Math.round((sceneStore.value.transformMatrix.a + Number.EPSILON) * 100) / 100;
    sceneStore.value.transformMatrix.d = sceneStore.value.transformMatrix.a;
  }

  setRenderTransforms(sceneStore.value.transformMatrix);
  drawElements();
}

function handleZoomIn() {
  if (typeof sceneStore.value.transformMatrix === "undefined") {
    return;
  }

  if (sceneStore.value.transformMatrix.a < 6) {
    sceneStore.value.transformMatrix.a += 0.1;
    sceneStore.value.transformMatrix.a =
      Math.round((sceneStore.value.transformMatrix.a + Number.EPSILON) * 100) / 100;
    sceneStore.value.transformMatrix.d = sceneStore.value.transformMatrix.a;
  }

  setRenderTransforms(sceneStore.value.transformMatrix);
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
    sceneStore.value.activeElements.length === 0 &&
    (sceneStore.value.selectedTool === Tool.ERASER || sceneStore.value.selectedTool === Tool.CUT)
  ) {
    return;
  }

  if (
    sceneStore.value.selectedTool === Tool.CHECKBOX ||
    sceneStore.value.selectedTool === Tool.TEXTBOX
  ) {
    return;
  }

  if (sceneStore.value.selectedTool === Tool.POINTER) {
    sceneStore.value.isPanning = true;
    handlePanTransform(event, true);
    return;
  }

  sceneStore.value.setIsStylus(event);

  if (!isDrawingAllowed(true) || drawingCanvas.value === null) {
    return;
  }

  sceneStore.value.isDrawing = true;

  const pos = getDrawPos(drawingCanvas.value, event, true);
  const isRulerLine = pos.isRulerLine;
  const pressure = sceneStore.value.getPressure(event);
  const opacity = sceneStore.value.getOpacity();
  const composition = sceneStore.value.getComposition();
  const size = sceneStore.value.selectedTool === Tool.CUT ? 0 : sceneStore.value.selectedToolSize;
  const strokeColor =
    sceneStore.value.selectedTool === Tool.CUT ? TRANSPARENT_COLOR : selectedStrokeColor.value;
  const fillColor =
    sceneStore.value.selectedTool === Tool.CUT ? TRANSPARENT_COLOR : selectedFillColor.value;

  const newElement: ICanvasElement = {
    id: uuidv4(),
    tool: sceneStore.value.selectedTool,
    fillColor,
    strokeColor,
    size,
    composition,
    opacity,
    isRulerLine,
    points: [{ x: pos.x, y: pos.y, pressure }],
    toolOptions: {
      lineEndSide: sceneStore.value.selectedLineEndSide,
      lineEndStyle: sceneStore.value.selectedLineEndStyle,
    },
    freehandOptions: {
      size: sceneStore.value.selectedToolSize,
      simulatePressure: sceneStore.value.selectedTool === Tool.PEN && !sceneStore.value.isStylus,
      thinning: sceneStore.value.selectedTool === Tool.PEN ? 0.95 : 0,
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
    newElement.points = sceneStore.value.calculateLinePoints(newElement, pos);
  }

  if (CANVAS_LINE_TOOLS.includes(newElement.tool)) {
    newElement.smoothPoints = sceneStore.value.getSmoothPoints(newElement);
  }
  newElement.dimensions = sceneStore.value.calculateDimensions(newElement as TElement);

  sceneStore.value.createElement(newElement as TElement);
  drawElements();
}

function handleCanvasTouchMove(event: Event) {
  if (!(sceneStore.value.isPanning || isDrawingAllowed()) || drawingCanvas.value === null) {
    return;
  }

  event.preventDefault();

  if (sceneStore.value.isPanning) {
    handlePanTransform(event);
    return;
  }

  const lastElementId = sceneStore.value.elementOrder[sceneStore.value.elementOrder.length - 1];
  const lastElement = sceneStore.value.elementById(lastElementId);
  const followRuler = lastElement.isRulerLine || !CANVAS_LINE_TOOLS.includes(lastElement.tool);
  const pos = getDrawPos(drawingCanvas.value, event, followRuler);
  const pressure = sceneStore.value.getPressure(event);

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
    lastElement.points = sceneStore.value.calculateLinePoints(lastElement, pos);
  } else {
    lastElement.points.push({ x: pos.x, y: pos.y, pressure });
  }

  lastElement.isRulerLine = pos.isRulerLine;

  if (CANVAS_LINE_TOOLS.includes(lastElement.tool)) {
    lastElement.smoothPoints = sceneStore.value.getSmoothPoints(lastElement);
  }

  lastElement.dimensions = sceneStore.value.calculateDimensions(lastElement);
  drawElements();
}

function handleCanvasTouchEnd(event) {
  if (sceneStore.value.isInteractiveEditMode || sceneStore.value.isTextboxEditMode) {
    return;
  }

  if (sceneStore.value.isPanning) {
    handlePanTransform(event);
    sceneStore.value.isPanning = false;
    return;
  }

  if (sceneStore.value.selectedTool === Tool.CHECKBOX) {
    const pos = getDrawPos(drawingCanvas.value, event, true);
    handleAddCheckbox(pos);
    return;
  }

  if (sceneStore.value.selectedTool === Tool.TEXTBOX) {
    const pos = getDrawPos(drawingCanvas.value, event, true);
    handleAddTextbox(pos);
    return;
  }

  if (!isDrawingAllowed() || drawingCanvas.value === null) {
    return;
  }

  const lastElementId = sceneStore.value.elementOrder[sceneStore.value.elementOrder.length - 1];
  const lastElement = sceneStore.value.elementById(lastElementId);
  lastElement.freehandOptions.last = true;
  lastElement.dimensions = sceneStore.value.calculateDimensions(lastElement);

  if (lastElement.dimensions.outerWidth === 0 || lastElement.dimensions.outerHeight === 0) {
    sceneStore.value.elementOrder.pop();
    sceneStore.value.isDrawing = false;
    return;
  }

  if (lastElement.tool === Tool.CUT) {
    handlePasteStart();
  } else {
    cacheElement(lastElementId);
    drawElements();
  }
  sceneStore.value.isDrawing = false;
}

function setRulerTransform(target, transform) {
  const nextTransform = {
    ...sceneStore.value.ruler.transform,
    ...transform,
  };

  const translate = `translate(${nextTransform.translate[0]}px, ${nextTransform.translate[1]}px)`;
  const scale = `scale(${nextTransform.scale[0]}, ${nextTransform.scale[1]})`;
  const rotate = `rotate(${nextTransform.rotate}deg)`;
  target.style.transform = `${translate} ${scale} ${rotate}`;
  sceneStore.value.ruler.transform = nextTransform;
}

function onRulerMoveStart() {
  sceneStore.value.isMovingRuler = true;
}

function onRulerMoveEnd() {
  sceneStore.value.isMovingRuler = false;
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
    ...sceneStore.value.pasteTransform,
    ...transform,
  };

  const translate = `translate(${nextTransform.translate[0]}px, ${nextTransform.translate[1]}px)`;
  const scale = `scale(${nextTransform.scale[0]}, ${nextTransform.scale[1]})`;
  const rotate = `rotate(${nextTransform.rotate}deg)`;
  target.style.transform = `${translate} ${scale} ${rotate}`;

  sceneStore.value.pasteTransform = nextTransform;
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
    ...sceneStore.value.imageTransform,
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

  sceneStore.value.imageTransform = nextTransform;
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
  const action = sceneStore.value.history[sceneStore.value.historyIndex];
  let redoPaste = false;
  let redoAddImage = false;

  if (sceneStore.value.isPasteMode) {
    cancelPaste();
  } else if (action.type === HistoryEvent.ADD_IMAGE_START) {
    cancelAddImage();
  } else if (action.type === HistoryEvent.ADD_CANVAS_ELEMENT) {
    const element = sceneStore.value.elementById(action.elementId);
    redoPaste = element.tool === Tool.PASTE;
    redoAddImage = element.tool === Tool.IMAGE;
    sceneStore.value.hideElement(action.elementId);
  } else if (action.type === HistoryEvent.REMOVE_CANVAS_ELEMENT) {
    sceneStore.value.showElement(action.elementId);
  } else if (action.type === HistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES) {
    const element = sceneStore.value.elementById(action.elementId);
    element.style = cloneDeep(action.from);
  }

  sceneStore.value.historyIndex -= 1;

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
  const action = sceneStore.value.history[sceneStore.value.historyIndex + 1];
  let redoPaste = false;
  let redoAddImage = false;

  if (action.type === HistoryEvent.ADD_CANVAS_ELEMENT) {
    const element = sceneStore.value.elementById(action.elementId);
    redoPaste = element.tool === Tool.CUT;
    sceneStore.value.showElement(action.elementId);
  } else if (action.type === HistoryEvent.REMOVE_CANVAS_ELEMENT) {
    sceneStore.value.hideElement(action.elementId);
  } else if (action.type === HistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES) {
    const element = sceneStore.value.elementById(action.elementId);
    element.style = cloneDeep(action.to);
  } else if (action.type === HistoryEvent.ADD_IMAGE_START) {
    redoAddImage = true;
  }

  sceneStore.value.historyIndex += 1;

  if (redoPaste) {
    handlePasteStart();
  } else if (redoAddImage) {
    handleAddImageStart(action.image, false);
  } else {
    sceneStore.value.isPasteMode = false;
    sceneStore.value.isAddImageMode = false;
    drawElements();
  }
}

let selectoInteractive, moveableInteractive;
let moveableElements: any[] = [];
function handleStartInteractiveEdit() {
  sceneStore.value.isInteractiveEditMode = true;
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
  sceneStore.value.isInteractiveEditMode = false;
  selectoInteractive.destroy();
  moveableInteractive.destroy();
}

function setInteractiveElementStyles(target, transform) {
  const elementId = target.getAttribute("data-element-id");
  const element = sceneStore.value.elementById(elementId);

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
  const element = sceneStore.value.elementById(elementId);
  element.tmpFromStyle = cloneDeep(element.style);
}

function handleInteractiveEnd(target) {
  const elementId = target.getAttribute("data-element-id");
  const element = sceneStore.value.elementById(elementId);
  sceneStore.value.addHistoryEvent({
    type: HistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES,
    elementId: element.id,
    to: cloneDeep(element.style),
    from: cloneDeep(element.tmpFromStyle),
  });

  delete element.tmpFromStyle;
}

function handleTextboxChange({ elementId, textContents }) {
  const element = sceneStore.value.elementById(elementId);
  (element.toolOptions as ITextboxElementOptions).textContents = textContents;
}

function handleTextboxFocus({ elementId }) {
  if (sceneStore.value.isDrawing) {
    return;
  }

  sceneStore.value.isTextboxEditMode = true;
  sceneStore.value.selectedTool = Tool.TEXTBOX;
  activeTextbox.value = elementId;
}

function handleTextboxBlur() {
  sceneStore.value.isTextboxEditMode = false;
}

function handleInteractiveElementEvent(e) {
  if (!sceneStore.value.isInteractiveEditMode && !sceneStore.value.isDrawing) {
    e.stopPropagation();
  }
}

function handleElementDelete() {
  for (let i = 0; i < moveableElements.length; i += 1) {
    const elementId = moveableElements[i].getAttribute("data-element-id");
    sceneStore.value.deleteElement(elementId);
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
  sceneStore.value.selectedFillSwatchId = swatchId;
  sceneStore.value.selectedFillColorIdx = colorIdx;
}

function handleStrokeColorChange(swatchId: string, colorIdx: number) {
  sceneStore.value.selectedStrokeSwatchId = swatchId;
  sceneStore.value.selectedStrokeColorIdx = colorIdx;
}

function handlePaperColorChange(swatchId: string, colorIdx: number) {
  sceneStore.value.selectedPaperSwatchId = swatchId;
  sceneStore.value.selectedPaperColorIdx = colorIdx;
}

function handlePatternColorChange(swatchId: string, colorIdx: number) {
  sceneStore.value.selectedPatternSwatchId = swatchId;
  sceneStore.value.selectedPatternColorIdx = colorIdx;
}
</script>

<template>
  <div class="canvas-wrapper">
    <!-- START TOOLS -->
    <div class="tools" v-if="sceneStore">
      <select v-model.number="sceneStore.selectedTool" @change="handleToolChange">
        <option v-for="tool in supportedTools" :key="tool.key" :value="tool.key">
          {{ tool.label }}
        </option>
      </select>
      <div v-if="sceneStore.selectedTool === Tool.LINE">
        <select v-model="sceneStore.selectedLineEndSide">
          <option v-for="endSide in LINE_END_SIDE_CHOICES" :key="endSide.key" :value="endSide.key">
            {{ endSide.label }}
          </option>
        </select>
        <select v-model="sceneStore.selectedLineEndStyle">
          <option
            v-for="endStyle in LINE_END_STYLE_CHOICES"
            :key="endStyle.key"
            :value="endStyle.key"
          >
            {{ endStyle.label }}
          </option>
        </select>
      </div>
      <label v-else-if="sceneStore.selectedTool === Tool.IMAGE">
        <input type="file" accept="image/*" @change="handleImageUpload" />
      </label>
      <label
        v-else-if="
          (sceneStore.selectedTool === Tool.CHECKBOX || sceneStore.selectedTool === Tool.TEXTBOX) &&
          !sceneStore.isInteractiveEditMode
        "
      >
        <button @click="handleStartInteractiveEdit">Edit</button>
      </label>

      <button v-if="sceneStore.isAddImageMode" @click="handleAddImageEnd">Done</button>
      <button v-if="sceneStore.isPasteMode" @click="handlePasteEnd">Done</button>
      <button v-if="sceneStore.isPasteMode" @click="handlePasteDelete">Delete Selection</button>
      <div v-if="sceneStore.isInteractiveEditMode">
        <button @click="handleElementDelete">Delete</button>
        <button @click="handleEndInteractiveEdit">Done</button>
      </div>
      <select v-if="sceneStore.isDrawingTool" v-model="sceneStore.selectedToolSize">
        <option v-for="size in PEN_SIZES" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
      <ColorPicker
        v-if="sceneStore.isDrawingTool"
        style="display: inline"
        :ref="addColorPickerRef"
        :swatchId="sceneStore.selectedFillSwatchId"
        :colorIdx="sceneStore.selectedFillColorIdx"
        :specialSwatchKey="SPECIAL_TOOL_SWATCH_KEY"
        @update="handleFillColorChange"
      />
      <ColorPicker
        v-if="sceneStore.isDrawingTool"
        style="display: inline"
        :ref="addColorPickerRef"
        :swatchId="sceneStore.selectedStrokeSwatchId"
        :colorIdx="sceneStore.selectedStrokeColorIdx"
        :specialSwatchKey="SPECIAL_TOOL_SWATCH_KEY"
        @update="handleStrokeColorChange"
      />
      <select v-if="sceneStore.isPaperTool" v-model="sceneStore.selectedPaperPatternIdx">
        <option v-for="(pattern, index) in canvasStore.paperPatterns" :key="index" :value="index">
          {{ pattern.LABEL }}
        </option>
      </select>
      <ColorPicker
        v-if="sceneStore.isPaperTool"
        style="display: inline"
        :ref="addColorPickerRef"
        :swatchId="sceneStore.selectedPaperSwatchId"
        :colorIdx="sceneStore.selectedPaperColorIdx"
        :specialSwatchKey="SPECIAL_PAPER_SWATCH_KEY"
        @update="handlePaperColorChange"
      />
      <ColorPicker
        v-if="sceneStore.isPaperTool"
        style="display: inline"
        :ref="addColorPickerRef"
        :swatchId="sceneStore.selectedPatternSwatchId"
        :colorIdx="sceneStore.selectedPatternColorIdx"
        :specialSwatchKey="SPECIAL_PAPER_SWATCH_KEY"
        @update="handlePatternColorChange"
      />
      <input
        v-if="sceneStore.isPaperTool"
        type="number"
        min="0"
        max="100"
        step="1"
        v-model="sceneStore.selectedPatternOpacity"
      />
      <input
        v-if="sceneStore.isPaperTool"
        type="number"
        min="0"
        max="512"
        step="1"
        v-model="selectedPatternStyles.lineSize"
      />
      <input
        v-if="sceneStore.isPaperTool"
        type="number"
        min="0"
        max="512"
        step="1"
        v-model="selectedPatternStyles.spacing"
      />

      <label><input type="checkbox" v-model="sceneStore.ruler.isVisible" /> Show ruler?</label>
      <label
        ><input type="checkbox" v-model="sceneStore.detectedStylus" :disabled="true" /> Detected
        Stylus?</label
      >
      <label
        ><input type="checkbox" v-model="sceneStore.isStylus" :disabled="true" />
        sceneStore.isStylus?</label
      >
      <label><input type="checkbox" v-model="sceneStore.allowFingerDrawing" /> finger?</label>
      <label><input type="checkbox" v-model="sceneStore.debugMode" /> debug?</label>
      <button @click="handleZoomOut">Zoom -</button>
      <button @click="handleZoomIn">Zoom +</button>
      <button :disabled="!sceneStore.hasUndo" @click="handleUndoClick">Undo</button>
      <button :disabled="!sceneStore.hasRedo" @click="handleRedoClick">Redo</button>
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
        v-if="sceneStore && sceneStore.ruler.isVisible"
        class="ruler-layer"
        :class="{ 'hide-ruler-controls': !sceneStore.showRulerControls }"
      >
        <div class="ruler" ref="rulerElement" :style="{ width: sceneStore.ruler.width + 'px' }">
          <div class="ruler__label">
            {{ Math.round(sceneStore.ruler.transform.rotate) }}&deg;
            <span v-if="sceneStore.elementOrder.length > 0 && sceneStore.isDrawing">
              <span
                v-if="sceneStore.elements[sceneStore.lastActiveElementId].dimensions.lineLength"
              >
                {{
                  Math.round(
                    sceneStore.elements[sceneStore.lastActiveElementId].dimensions.lineLength
                  )
                }}px
              </span>
              <span v-else>
                {{
                  Math.round(
                    sceneStore.elements[sceneStore.lastActiveElementId].dimensions.outerWidth
                  )
                }}
                x
                {{
                  Math.round(
                    sceneStore.elements[sceneStore.lastActiveElementId].dimensions.outerHeight
                  )
                }}
              </span>
            </span>
          </div>
          <div class="ruler__tool" :style="{ width: sceneStore.ruler.width + 'px' }"></div>
        </div>
        <MoveableVue
          ref="moveableRuler"
          v-if="sceneStore.ruler.isVisible"
          className="moveable-ruler"
          :target="['.ruler']"
          :pinchable="['rotatable']"
          :draggable="!sceneStore.isDrawing"
          :rotatable="!sceneStore.isDrawing"
          :scalable="false"
          :throttleRotate="1"
          @drag="onRulerDrag"
          @rotate="onRulerRotate"
          @renderStart="onRulerMoveStart"
          @renderEnd="onRulerMoveEnd"
        />
      </div>

      <div class="image-layer" v-if="sceneStore && sceneStore.isAddImageMode">
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

      <div class="paste-layer" v-if="sceneStore && sceneStore.isPasteMode" ref="pasteLayer">
        <canvas class="paste-canvas" ref="pasteCanvas"></canvas>
      </div>

      <div class="drawing-layer">
        <div
          v-if="sceneStore"
          ref="interactiveCanvas"
          class="interactive-canvas"
          :style="{
            width: canvasStore.canvasConfig.width + 'px',
            height: canvasStore.canvasConfig.height + 'px',
            transform: `matrix(1, 0, 0, 1, 0, 0)`,
          }"
        >
          <template v-for="(elementId, index) in sceneStore.activeHtmlElements" :key="index">
            <input
              v-if="sceneStore.elements[elementId].tool === Tool.CHECKBOX"
              class="interactiveElement"
              v-model="(sceneStore.elements[elementId].toolOptions as ICheckboxElementOptions).isChecked"
              :data-element-id="sceneStore.elements[elementId].id"
              type="checkbox"
              :style="{
                position: 'absolute',
                transform: sceneStore.elements[elementId].getInteractiveElementTransform(
                  sceneStore.initTransformMatrix,
                  sceneStore.transformMatrix
                ),
              }"
              @mousedown="handleInteractiveElementEvent"
              @touchstart="handleInteractiveElementEvent"
              @mouseup="handleInteractiveElementEvent"
              @touchend="handleInteractiveElementEvent"
              @mousemove="handleInteractiveElementEvent"
              @touchmove="handleInteractiveElementEvent"
            />
            <Ftextarea
              v-else-if="sceneStore.elements[elementId].tool === Tool.TEXTBOX"
              :data-element-id="sceneStore.elements[elementId].id"
              class="interactiveElement"
              :style="{
                position: 'absolute',
                transform: sceneStore.elements[elementId].getInteractiveElementTransform(
                  sceneStore.initTransformMatrix,
                  sceneStore.transformMatrix
                ),
              }"
              :element="sceneStore.elements[elementId]"
              :is-active="sceneStore.elements[elementId].id === activeTextbox"
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

      <div v-if="sceneStore" class="paper-layer">
        <div class="paper-color" :style="{ background: getColorAsCss(selectedPaperColor) }"></div>
        <svg class="paper-pattern" width="100%" height="100%">
          <component
            id="paper-svg-pattern"
            :is="selectedPatternComponent.COMPONENT"
            :fillColor="getColorAsCss(selectedPatternColor)"
            :lineSize="sceneStore.paperPatternTransform.lineSize"
            :spacing="sceneStore.paperPatternTransform.spacing"
            :x="sceneStore.paperPatternTransform.x"
            :y="sceneStore.paperPatternTransform.y"
          />
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#paper-svg-pattern)"
            :opacity="sceneStore.selectedPatternOpacity / 100"
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
