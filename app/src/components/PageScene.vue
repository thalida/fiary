<script setup lang="ts">
import { ref, computed, watch, watchPostEffect, onMounted, nextTick, watchEffect } from "vue";
import cloneDeep from "lodash/cloneDeep";
import Moveable from "moveable";
import MoveableVue from "vue3-moveable";

import { useCanvasStore } from "@/stores/canvas";
import {
  PageHistoryEvent as HistoryEvent,
  ELEMENT_TYPE,
  CANVAS_TOOL_CHOICES as supportedTools,
  CANVAS_POINTER_TOOL,
  CANVAS_PAPER_TOOL,
  CANVAS_LINE_TOOLS,
  LINE_END_SIDE_CHOICES,
  LINE_END_STYLE_CHOICES,
  PEN_SIZES,
  TRANSPARENT_COLOR,
  SPECIAL_TOOL_SWATCH_KEY,
  SPECIAL_PAPER_SWATCH_KEY,
} from "@/constants/core";
import type { IElementPoint, TPrimaryKey } from "@/types/core";
import { ELEMENT_MAP } from "@/models/elements";
import ColorPicker from "@/components/PageColorPicker.vue";
import PageInteractiveLayer from "@/components/PageInteractiveLayer.vue";
import PagePaperLayer from "@/components/PagePaperLayer.vue";
import PageDrawingLayer from "@/components/PageDrawingLayer.vue";

console.log("Updated PageScene");
const props = defineProps<{ pageId: TPrimaryKey }>();
const canvasStore = useCanvasStore();

const sceneStore = computed(() => canvasStore.scenes[props.pageId]);

const activeImage = ref<HTMLImageElement | null>(null);
const interactiveLayer = ref<typeof PageInteractiveLayer>();
const paperLayer = ref<typeof PagePaperLayer>();
const drawingLayer = ref<typeof PageDrawingLayer>();
const drawingCanvas = ref<HTMLCanvasElement>();
const imagePreviewCanvas = ref<HTMLCanvasElement>();
const imageBackdropCanvas = ref<HTMLCanvasElement>();
const pasteLayer = ref<HTMLElement>();
const pasteCanvas = ref<HTMLCanvasElement>();
const moveableRuler = ref();
let moveablePaste: any = null;
const moveableImage = ref();
const rulerElement = ref();
const colorPickerRefs: any[] = [];

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
const selectedPatternStyles = computed(() => {
  return canvasStore.getPaperPatternPropsByIdx(sceneStore.value.selectedPaperPatternIdx);
});

function initScene(canvas: HTMLCanvasElement) {
  if (typeof canvas === "undefined") {
    return;
  }

  const ctx = canvas.getContext("2d");

  if (ctx === null) {
    return;
  }

  drawingCanvas.value = canvas;
  canvasStore.setupSceneStore(props.pageId, ctx.getTransform());

  watch(
    () => (sceneStore.value ? sceneStore.value.debugMode : false),
    () => {
      drawElements();
    }
  );

  watchEffect(() => {
    paperLayer.value?.setPaperTransforms(sceneStore.value.transformMatrix);
  });

  watchPostEffect(() => {
    if (sceneStore.value?.ruler.isVisible) {
      setRulerTransform(rulerElement.value, {});
    }
  });
}

function addColorPickerRef(ref: any) {
  if (ref !== null) {
    colorPickerRefs.push(ref);
  }
}

function handleToolChange(event: Event) {
  if (sceneStore.value.selectedTool === ELEMENT_TYPE.CLEAR_ALL) {
    handleClearAll();
  }

  sceneStore.value.isTextboxEditMode = false;
  sceneStore.value.activeElementId = null;

  if (event.target) {
    (event.target as HTMLElement).blur();
  }
}

function isDrawingAllowed(isDrawingOverride = false) {
  const activelyDrawing = sceneStore.value.isDrawing || isDrawingOverride;
  return !canvasStore.isSwatchOpen && sceneStore.value.isDrawingAllowed && activelyDrawing;
}

function clearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
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
    if (typeof element.drawElement === "undefined") {
      continue;
    }
    element.drawElement(drawingCanvas.value);
  }
}

function handleAddCheckbox(pos: IElementPoint) {
  const checkboxElement = new ELEMENT_MAP[ELEMENT_TYPE.CHECKBOX]({
    pos,
    initMatrix: sceneStore.value.initTransformMatrix,
    matrix: sceneStore.value.transformMatrix,
  });
  sceneStore.value.createElement(checkboxElement);
}

function handleAddTextbox(pos: IElementPoint) {
  const textboxElement = new ELEMENT_MAP[ELEMENT_TYPE.TEXTBOX]({
    pos,
    initMatrix: sceneStore.value.initTransformMatrix,
    matrix: sceneStore.value.transformMatrix,
  });
  sceneStore.value.createElement(textboxElement);
}

function handleClearAll() {
  const lastElementId = sceneStore.value.lastActiveElementId;
  const lastElement = sceneStore.value.elementById(lastElementId);
  if (
    sceneStore.value.elementOrder.length === 0 ||
    (sceneStore.value.elementOrder.length > 0 && lastElement.tool === ELEMENT_TYPE.CLEAR_ALL)
  ) {
    return;
  }

  const clearElement = new ELEMENT_MAP[ELEMENT_TYPE.CLEAR_ALL]({
    pos: {
      x: canvasStore.canvasConfig.width,
      y: canvasStore.canvasConfig.height,
    },
  });
  clearElement.cacheElement();
  sceneStore.value.createElement(clearElement);
  drawElements();
  sceneStore.value.selectedTool = ELEMENT_TYPE.ERASER;
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
    cutSelection.cacheElement();
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
    element.drawElement(pasteCanvas.value);
  }
  const cutSelectionClip = cloneDeep(cutSelection);
  cutSelectionClip.isDrawingCached = false;
  cutSelectionClip.cache = {};
  cutSelectionClip.composition = "destination-in";
  cutSelectionClip.drawElement(pasteCanvas.value);

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
  const pasteElement = new ELEMENT_MAP[ELEMENT_TYPE.PASTE](moveableRect);

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

  sceneStore.value.createElement(pasteElement);
  drawElements();
  sceneStore.value.isPasteMode = false;
}

function handlePasteDelete() {
  drawElements();
  sceneStore.value.isPasteMode = false;
}

async function handleAddImageStart(image: HTMLImageElement, trackHistory = true) {
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
  if (typeof imagePreviewCanvas.value === "undefined" || activeImage.value === null) {
    return;
  }

  const moveableRect = moveableImage.value.getRect();
  const imageElement = new ELEMENT_MAP[ELEMENT_TYPE.IMAGE](activeImage.value, moveableRect);

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

  sceneStore.value.createElement(imageElement);
  drawElements();
  activeImage.value = null;
  sceneStore.value.isAddImageMode = false;
}

function cancelAddImage() {
  sceneStore.value.isAddImageMode = false;
}

function handlePanTransform(event: MouseEvent | TouchEvent, isStart = false) {
  if (
    typeof sceneStore.value.transformMatrix === "undefined" ||
    typeof drawingCanvas.value === "undefined"
  ) {
    return;
  }

  const pos = sceneStore.value.getMousePos(drawingCanvas.value, event);

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

  paperLayer.value?.setPaperTransforms(sceneStore.value.transformMatrix);
  interactiveLayer.value?.setInteractiveElementTransforms(
    sceneStore.value.initTransformMatrix,
    sceneStore.value.transformMatrix
  );
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

  paperLayer.value?.setPaperTransforms(sceneStore.value.transformMatrix);
  interactiveLayer.value?.setInteractiveElementTransforms(
    sceneStore.value.initTransformMatrix,
    sceneStore.value.transformMatrix
  );
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

  paperLayer.value?.setPaperTransforms(sceneStore.value.transformMatrix);
  interactiveLayer.value?.setInteractiveElementTransforms(
    sceneStore.value.initTransformMatrix,
    sceneStore.value.transformMatrix
  );
  drawElements();
}

function closeAllColorPickers() {
  for (let i = 0; i < colorPickerRefs.length; i += 1) {
    colorPickerRefs[i].closeDropdown();
  }
}

function handleCanvasTouchStart(event: MouseEvent | TouchEvent) {
  closeAllColorPickers();

  if (sceneStore.value.selectedTool === CANVAS_POINTER_TOOL) {
    sceneStore.value.isPanning = true;
    handlePanTransform(event, true);
    return;
  }

  if (sceneStore.value.selectedTool === CANVAS_PAPER_TOOL) {
    return;
  }

  const selectedTool = sceneStore.value.selectedTool as ELEMENT_TYPE;

  if (
    sceneStore.value.activeElements.length === 0 &&
    (selectedTool === ELEMENT_TYPE.ERASER || selectedTool === ELEMENT_TYPE.CUT)
  ) {
    return;
  }

  if (
    selectedTool === ELEMENT_TYPE.CHECKBOX ||
    selectedTool === ELEMENT_TYPE.TEXTBOX ||
    selectedTool === ELEMENT_TYPE.CLEAR_ALL ||
    selectedTool === ELEMENT_TYPE.PASTE ||
    selectedTool === ELEMENT_TYPE.IMAGE
  ) {
    return;
  }

  sceneStore.value.setIsStylus(event);

  if (
    !isDrawingAllowed(true) ||
    typeof drawingCanvas.value === "undefined" ||
    drawingCanvas.value === null
  ) {
    return;
  }

  sceneStore.value.isDrawing = true;

  const strokeColor =
    selectedTool === ELEMENT_TYPE.CUT ? TRANSPARENT_COLOR : selectedStrokeColor.value;
  const fillColor = selectedTool === ELEMENT_TYPE.CUT ? TRANSPARENT_COLOR : selectedFillColor.value;

  const newElement = new ELEMENT_MAP[selectedTool]({
    tool: selectedTool,
    strokeColor,
    fillColor,
  });

  const pos = sceneStore.value.getDrawPos(drawingCanvas.value, event, true, moveableRuler.value);
  newElement.isRulerLine = pos.isRulerLine;
  newElement.size = selectedTool === ELEMENT_TYPE.CUT ? 0 : sceneStore.value.selectedToolSize;
  newElement.toolOptions = {
    lineEndSide: sceneStore.value.selectedLineEndSide,
    lineEndStyle: sceneStore.value.selectedLineEndStyle,
  };
  newElement.freehandOptions = {
    size: sceneStore.value.selectedToolSize,
    simulatePressure: selectedTool === ELEMENT_TYPE.PEN && !sceneStore.value.isStylus,
    thinning: selectedTool === ELEMENT_TYPE.PEN ? 0.95 : 0,
    streamline: newElement.isRulerLine ? 1 : 0.32,
    smoothing: newElement.isRulerLine ? 1 : 0.32,
    last: false,
  };

  const pressure = newElement.getPressure(event, sceneStore.value.isStylus);
  newElement.points = [{ x: pos.x, y: pos.y, pressure }];

  if (
    newElement.tool === ELEMENT_TYPE.CIRCLE ||
    newElement.tool === ELEMENT_TYPE.RECTANGLE ||
    newElement.tool === ELEMENT_TYPE.BLOB ||
    newElement.tool === ELEMENT_TYPE.ERASER
  ) {
    newElement.points.push({ x: pos.x, y: pos.y, pressure });
  } else if (newElement.tool === ELEMENT_TYPE.TRIANGLE) {
    newElement.points.push({ x: pos.x, y: pos.y, pressure });
    newElement.points.push({ x: pos.x, y: pos.y, pressure });
  } else if (newElement.tool === ELEMENT_TYPE.LINE) {
    newElement.points = newElement.calculateLinePoints(pos);
  }

  if (CANVAS_LINE_TOOLS.includes(newElement.tool)) {
    newElement.smoothPoints = newElement.getSmoothPoints();
  }

  newElement.dimensions = newElement.calculateDimensions();
  sceneStore.value.createElement(newElement);
  drawElements();
}

function handleCanvasTouchMove(event: MouseEvent | TouchEvent) {
  if (
    !(sceneStore.value.isPanning || isDrawingAllowed()) ||
    typeof drawingCanvas.value === "undefined" ||
    drawingCanvas.value === null
  ) {
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
  const pos = sceneStore.value.getDrawPos(
    drawingCanvas.value,
    event,
    followRuler,
    moveableRuler.value
  );
  const pressure = lastElement.getPressure(event, sceneStore.value.isStylus);

  if (lastElement.tool === ELEMENT_TYPE.CIRCLE || lastElement.tool === ELEMENT_TYPE.RECTANGLE) {
    lastElement.points[1] = { x: pos.x, y: pos.y, pressure };
  } else if (lastElement.tool === ELEMENT_TYPE.TRIANGLE) {
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
  } else if (lastElement.tool === ELEMENT_TYPE.LINE) {
    lastElement.points = lastElement.calculateLinePoints(pos);
  } else {
    lastElement.points.push({ x: pos.x, y: pos.y, pressure });
  }

  lastElement.isRulerLine = pos.isRulerLine;

  if (CANVAS_LINE_TOOLS.includes(lastElement.tool)) {
    lastElement.smoothPoints = lastElement.getSmoothPoints();
  }

  lastElement.dimensions = lastElement.calculateDimensions();
  drawElements();
}

function handleCanvasTouchEnd(event: MouseEvent | TouchEvent) {
  if (
    sceneStore.value.isInteractiveEditMode ||
    sceneStore.value.isTextboxEditMode ||
    typeof drawingCanvas.value === "undefined"
  ) {
    return;
  }

  if (sceneStore.value.isPanning) {
    handlePanTransform(event);
    sceneStore.value.isPanning = false;
    return;
  }

  if (sceneStore.value.selectedTool === ELEMENT_TYPE.CHECKBOX) {
    const pos = sceneStore.value.getDrawPos(drawingCanvas.value, event, true, moveableRuler.value);
    handleAddCheckbox(pos);
    return;
  }

  if (sceneStore.value.selectedTool === ELEMENT_TYPE.TEXTBOX) {
    const pos = sceneStore.value.getDrawPos(drawingCanvas.value, event, true, moveableRuler.value);
    handleAddTextbox(pos);
    return;
  }

  if (!isDrawingAllowed() || drawingCanvas.value === null) {
    return;
  }

  const lastElementId = sceneStore.value.elementOrder[sceneStore.value.elementOrder.length - 1];
  const lastElement = sceneStore.value.elementById(lastElementId);
  lastElement.freehandOptions.last = true;
  lastElement.dimensions = lastElement.calculateDimensions();

  if (lastElement.dimensions.outerWidth === 0 || lastElement.dimensions.outerHeight === 0) {
    sceneStore.value.elementOrder.pop();
    sceneStore.value.isDrawing = false;
    return;
  }

  if (lastElement.tool === ELEMENT_TYPE.CUT) {
    handlePasteStart();
  } else {
    lastElement.cacheElement();
    drawElements();
  }
  sceneStore.value.isDrawing = false;
}

function setRulerTransform(
  target: HTMLElement,
  transform: { translate?: number[]; scale?: number[]; rotate?: number }
) {
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

function onRulerDrag({ target, translate }: { target: HTMLElement; translate: number[] }) {
  setRulerTransform(target, { translate });
}

function onRulerRotate({
  target,
  drag,
  rotation,
}: {
  target: HTMLElement;
  drag: { translate: number[] };
  rotation: number;
}) {
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

function setPasteTransform(
  target: HTMLElement,
  transform: { translate?: number[]; scale?: number[]; rotate?: number }
) {
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

function onPasteDrag({ target, translate }: { target: HTMLElement; translate: number[] }) {
  setPasteTransform(target, { translate });
}

function onPasteRotate({
  target,
  rotate,
  drag,
}: {
  target: HTMLElement;
  rotate: number;
  drag: { translate: number[] };
}) {
  setPasteTransform(target, { rotate, translate: drag.translate });
}

function onPasteScale({
  target,
  scale,
  drag,
}: {
  target: HTMLElement;
  scale: number[];
  drag: { translate: number[] };
}) {
  setPasteTransform(target, { scale, translate: drag.translate });
}

function handleImageUpload(e: Event) {
  const target = e.target as HTMLInputElement;

  if (target === null || target.files === null || target.files.length === 0) {
    return;
  }
  const file = target.files[0];

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

    target.value = "";
  };

  reader.readAsDataURL(file);
}

function setImageStyles(
  target: HTMLElement,
  transform: {
    translate?: number[];
    scale?: number[];
    rotate?: number;
    clipType?: string;
    clipStyles?: number[];
  }
) {
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

function onImageDrag({ target, translate }: { target: HTMLElement; translate: number[] }) {
  setImageStyles(target, { translate });
}

function onImageRotate({
  target,
  rotate,
  drag,
}: {
  target: HTMLElement;
  rotate: number;
  drag: { translate: number[] };
}) {
  setImageStyles(target, { rotate, translate: drag.translate });
}

function onImageScale({
  target,
  scale,
  drag,
}: {
  target: HTMLElement;
  scale: number[];
  drag: { translate: number[] };
}) {
  setImageStyles(target, { scale, translate: drag.translate });
}

function onImageClip({
  target,
  clipType,
  clipStyles,
}: {
  target: HTMLElement;
  clipType: string;
  clipStyles: number[];
}) {
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
    redoPaste = element.tool === ELEMENT_TYPE.PASTE;
    redoAddImage = element.tool === ELEMENT_TYPE.IMAGE;
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
    redoPaste = element.tool === ELEMENT_TYPE.CUT;
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
      <select v-model="sceneStore.selectedTool" @change="handleToolChange">
        <option v-for="tool in supportedTools" :key="tool.key" :value="tool.key">
          {{ tool.label }}
        </option>
      </select>
      <div v-if="sceneStore.selectedTool === ELEMENT_TYPE.LINE">
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
      <label v-else-if="sceneStore.selectedTool === ELEMENT_TYPE.IMAGE">
        <input type="file" accept="image/*" @change="handleImageUpload" />
      </label>
      <label
        v-else-if="
          (sceneStore.selectedTool === ELEMENT_TYPE.CHECKBOX ||
            sceneStore.selectedTool === ELEMENT_TYPE.TEXTBOX) &&
          !sceneStore.isInteractiveEditMode
        "
      >
        <button @click="interactiveLayer?.handleStartInteractiveEdit">Edit</button>
      </label>

      <button v-if="sceneStore.isAddImageMode" @click="handleAddImageEnd">Done</button>
      <button v-if="sceneStore.isPasteMode" @click="handlePasteEnd">Done</button>
      <button v-if="sceneStore.isPasteMode" @click="handlePasteDelete">Delete Selection</button>
      <div v-if="sceneStore.isInteractiveEditMode">
        <button @click="interactiveLayer?.handleInteractiveElementDelete">Delete</button>
        <button @click="interactiveLayer?.handleEndInteractiveEdit">Done</button>
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

      <div class="drawing-area">
        <PageInteractiveLayer
          ref="interactiveLayer"
          class="interactive-layer"
          :pageId="props.pageId"
        />
        <PageDrawingLayer ref="drawingLayer" class="drawing-layer" @ready="initScene" />
      </div>
      <PagePaperLayer ref="paperLayer" class="paper-layer" :pageId="props.pageId" />
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

.drawing-area,
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

.drawing-area {
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

.drawing-area .drawing-layer,
.drawing-area .interactive-layer {
  position: absolute;
  top: 0;
  left: 0;
}

.drawing-area .drawing-layer {
  z-index: 0;
}

.drawing-area .interactive-layer {
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
