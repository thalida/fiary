<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue";
import cloneDeep from "lodash/cloneDeep";
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
import PageInteractiveLayer from "@/components/PageInteractiveLayer.vue";
import PagePaperLayer from "@/components/PagePaperLayer.vue";
import PageDrawingLayer from "@/components/PageDrawingLayer.vue";
import PagePasteLayer from "@/components/PagePasteLayer.vue";
import PageAddImageLayer from "@/components/PageAddImageLayer.vue";
import PageRulerLayer from "@/components/PageRulerLayer.vue";
import PageToolbar from "@/components/PageToolbar.vue";

console.log("Updated PageScene");
const props = defineProps<{ pageId: TPrimaryKey }>();
const canvasStore = useCanvasStore();

const sceneStore = computed(() => canvasStore.scenes[props.pageId]);

const interactiveLayer = ref<typeof PageInteractiveLayer>();
const paperLayer = ref<typeof PagePaperLayer>();
const drawingLayer = ref<typeof PageDrawingLayer>();
const pasteLayer = ref<typeof PagePasteLayer>();
const addImageLayer = ref<typeof PageAddImageLayer>();
const rulerLayer = ref<typeof PageRulerLayer>();
const toolbar = ref<typeof PageToolbar>();
const drawingCanvas = ref<HTMLCanvasElement>();

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
      drawingLayer.value?.drawElements();
    }
  );

  watchEffect(() => {
    paperLayer.value?.setPaperTransforms(sceneStore.value.transformMatrix);
  });
}

function isDrawingAllowed(isDrawingOverride = false) {
  const activelyDrawing = sceneStore.value.isDrawing || isDrawingOverride;
  return !canvasStore.isSwatchOpen && sceneStore.value.isDrawingAllowed && activelyDrawing;
}

function handleToolChange() {
  if (sceneStore.value.selectedTool === ELEMENT_TYPE.CLEAR_ALL) {
    handleClearAll();
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
  drawingLayer.value?.drawElements();
  sceneStore.value.selectedTool = ELEMENT_TYPE.ERASER;
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
  drawingLayer.value?.drawElements();
}
function handleSurfaceTouchStart(event: MouseEvent | TouchEvent) {
  toolbar.value?.closeAllColorPickers();

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

  const pos = sceneStore.value.getDrawPos(
    drawingCanvas.value,
    event,
    true,
    rulerLayer.value?.moveableEl
  );
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
  drawingLayer.value?.drawElements();
}

function handleSurfaceTouchMove(event: MouseEvent | TouchEvent) {
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
    rulerLayer.value?.moveableEl
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
  drawingLayer.value?.drawElements();
}

function handleSurfaceTouchEnd(event: MouseEvent | TouchEvent) {
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
    const pos = sceneStore.value.getDrawPos(
      drawingCanvas.value,
      event,
      true,
      rulerLayer.value?.moveableEl
    );
    handleAddCheckbox(pos);
    return;
  }

  if (sceneStore.value.selectedTool === ELEMENT_TYPE.TEXTBOX) {
    const pos = sceneStore.value.getDrawPos(
      drawingCanvas.value,
      event,
      true,
      rulerLayer.value?.moveableEl
    );
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
    pasteLayer.value?.handlePasteStart();
  } else {
    lastElement.cacheElement();
    drawingLayer.value?.drawElements();
  }
  sceneStore.value.isDrawing = false;
}

function handleZoomOut() {
  if (typeof sceneStore.value.transformMatrix === "undefined") {
    return;
  }

  paperLayer.value?.setPaperTransforms(sceneStore.value.transformMatrix);
  interactiveLayer.value?.setInteractiveElementTransforms(
    sceneStore.value.initTransformMatrix,
    sceneStore.value.transformMatrix
  );
  drawingLayer.value?.drawElements();
}

function handleZoomIn() {
  if (typeof sceneStore.value.transformMatrix === "undefined") {
    return;
  }

  paperLayer.value?.setPaperTransforms(sceneStore.value.transformMatrix);
  interactiveLayer.value?.setInteractiveElementTransforms(
    sceneStore.value.initTransformMatrix,
    sceneStore.value.transformMatrix
  );
  drawingLayer.value?.drawElements();
}

function handleUndo() {
  const action = sceneStore.value.history[sceneStore.value.historyIndex];
  let redoPaste = false;
  let redoAddImage = false;

  if (sceneStore.value.isPasteMode) {
    pasteLayer.value?.handleCancelPaste();
  } else if (action.type === HistoryEvent.ADD_IMAGE_START) {
    addImageLayer.value?.handleCancelAddImage();
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
    pasteLayer.value?.handlePasteStart();
  } else if (redoAddImage) {
    drawingLayer.value?.drawElements();
    addImageLayer.value?.handleAddImageStart(action.image, false);
  } else {
    drawingLayer.value?.drawElements();
  }
}

function handleRedo() {
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
    pasteLayer.value?.handlePasteStart();
  } else if (redoAddImage) {
    addImageLayer.value?.handleAddImageStart(action.image, false);
  } else {
    sceneStore.value.isPasteMode = false;
    sceneStore.value.isAddImageMode = false;
    drawingLayer.value?.drawElements();
  }
}
</script>

<template>
  <div class="canvas-wrapper">
    <div class="toolbar">
      <PageToolbar
        ref="toolbar"
        :pageId="pageId"
        @update:tool="handleToolChange"
        @action:history:undo="handleUndo"
        @action:history:redo="handleRedo"
        @action:camera:zoom-in="handleZoomIn"
        @action:camera:zoom-out="handleZoomOut"
        @action:interactiveEdit:start="interactiveLayer?.handleStartInteractiveEdit"
        @action:interactiveEdit:end="interactiveLayer?.handleEndInteractiveEdit"
        @action:interactiveEdit:elementDelete="interactiveLayer?.handleInteractiveElementDelete"
        @action:addImage:inputChange="addImageLayer?.handleImageUpload"
        @action:addImage:end="addImageLayer?.handleAddImageEnd"
        @action:paste:delete="pasteLayer?.handlePasteDelete"
        @action:paste:end="pasteLayer?.handlePasteEnd"
      />
    </div>
    <div
      class="surface"
      @mousedown="handleSurfaceTouchStart"
      @touchstart="handleSurfaceTouchStart"
      @mouseup="handleSurfaceTouchEnd"
      @touchend="handleSurfaceTouchEnd"
      @mousemove="handleSurfaceTouchMove"
      @touchmove="handleSurfaceTouchMove"
    >
      <PageRulerLayer ref="rulerLayer" class="ruler-layer" :pageId="pageId" />

      <PageAddImageLayer
        ref="addImageLayer"
        class="image-layer"
        :pageId="pageId"
        @redraw="drawingLayer?.drawElements"
      />

      <PagePasteLayer
        ref="pasteLayer"
        class="paste-layer"
        :pageId="props.pageId"
        @redraw="drawingLayer?.drawElements"
      />

      <div class="drawing-area">
        <PageInteractiveLayer
          ref="interactiveLayer"
          class="interactive-layer"
          :pageId="props.pageId"
        />
        <PageDrawingLayer
          ref="drawingLayer"
          class="drawing-layer"
          :pageId="props.pageId"
          @ready="initScene"
        />
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

.toolbar {
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
</style>

<style>
.moveable-control-box .moveable-control.moveable-origin {
  display: none;
}
</style>
