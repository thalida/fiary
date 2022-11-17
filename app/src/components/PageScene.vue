<script setup lang="ts">
import { ref, computed, watch, watchEffect, onBeforeUnmount } from "vue";
import type Moveable from "moveable";
import cloneDeep from "lodash/cloneDeep";
import {
  PageHistoryEvent as HistoryEvent,
  ELEMENT_TYPE,
  CANVAS_POINTER_TOOL,
  CANVAS_PAPER_TOOL,
  CANVAS_LINE_TOOLS,
  TRANSPARENT_COLOR,
  CANVAS_INTERACTIVE_TOOLS,
  CANVAS_NONDRAWING_TOOLS,
} from "@/constants/core";
import type { ICanvasSettings, IElement, IElementPoint, TPrimaryKey } from "@/types/core";
import { ELEMENT_MAP } from "@/models/elements";
import PageInteractiveLayer from "@/components/PageInteractiveLayer.vue";
import PagePaperLayer from "@/components/PagePaperLayer.vue";
import PageDrawingLayer from "@/components/PageDrawingLayer.vue";
import PagePasteLayer from "@/components/PagePasteLayer.vue";
import PageAddImageLayer from "@/components/PageAddImageLayer.vue";
import PageRulerLayer from "@/components/PageRulerLayer.vue";
import PageToolbar from "@/components/PageToolbar.vue";
import { useCoreStore } from "@/stores/core";
import type LineElement from "@/models/elements/LineElement";
import type BaseCanvasElement from "@/models/BaseCanvasElement";
import type BaseElement from "@/models/BaseElement";

console.log("Updated PageScene");
const props = defineProps<{ pageUid: TPrimaryKey }>();
const coreStore = useCoreStore();

const page = computed(() => coreStore.pages[props.pageUid]);
const pageOptions = computed(() => coreStore.pageOptions[props.pageUid]);

const interactiveLayer = ref<typeof PageInteractiveLayer>();
const paperLayer = ref<typeof PagePaperLayer>();
const drawingLayer = ref<typeof PageDrawingLayer>();
const pasteLayer = ref<typeof PagePasteLayer>();
const addImageLayer = ref<typeof PageAddImageLayer>();
const rulerLayer = ref<typeof PageRulerLayer>();
const toolbar = ref<typeof PageToolbar>();
const drawingCanvas = ref<HTMLCanvasElement>();
const activePanCoords = ref<{ x: number; y: number }[]>([]);

const selectedFillColor = computed(() => coreStore.selectedFillColor(props.pageUid));
const selectedStrokeColor = computed(() => coreStore.selectedStrokeColor(props.pageUid));

function initScene(canvas: HTMLCanvasElement) {
  if (typeof canvas === "undefined") {
    return;
  }

  const ctx = canvas.getContext("2d");

  if (ctx === null) {
    return;
  }

  drawingCanvas.value = canvas;
  coreStore.initPageOptions(drawingCanvas.value, props.pageUid, ctx.getTransform());
  drawingLayer.value?.drawElements();
  interactiveLayer.value?.setInteractiveElementTransforms();

  watch(
    () => (pageOptions.value ? pageOptions.value.isDebugMode : false),
    () => {
      drawingLayer.value?.drawElements();
    }
  );

  watchEffect(() => {
    paperLayer.value?.setPaperTransforms();
  });

  coreStore.startAutoSave();
}

onBeforeUnmount(() => {
  coreStore.stopAutoSave();
});

function isDrawingAllowed(isDrawingOverride = false) {
  const activelyDrawing = pageOptions.value.isDrawing || isDrawingOverride;
  const isOverlayMode =
    pageOptions.value.isSwatchOpen ||
    pageOptions.value.isPasteMode ||
    pageOptions.value.isAddImageMode ||
    pageOptions.value.isInteractiveEditMode ||
    pageOptions.value.isMovingRuler ||
    pageOptions.value.isTextboxEditMode;
  const isNonDrawingTool = CANVAS_NONDRAWING_TOOLS.includes(pageOptions.value.selectedTool);
  const stylusAllowed = pageOptions.value.detectedStylus && pageOptions.value.isStylus;
  const isFingerAllowed = !pageOptions.value.isStylus && pageOptions.value.allowFingerDrawing;

  return (
    activelyDrawing && !isOverlayMode && !isNonDrawingTool && (stylusAllowed || isFingerAllowed)
  );
}

function handleToolChange() {
  interactiveLayer.value?.reset();

  if (pageOptions.value.selectedTool === ELEMENT_TYPE.CLEAR_ALL) {
    handleClearAll();
  }
}

function handleAddCheckbox(pos: IElementPoint) {
  const checkboxElement = new ELEMENT_MAP[ELEMENT_TYPE.CHECKBOX]({
    pageUid: props.pageUid,
    tool: ELEMENT_TYPE.CHECKBOX,
    points: [pos],
    transform: {
      translate: [pos.x, pos.y],
      scale: [1, 1],
      rotate: 0,
    },
  });

  coreStore.addElement(checkboxElement);
  interactiveLayer.value?.setInteractiveElementTransforms();
}

function handleAddTextbox(pos: IElementPoint) {
  const textboxElement = new ELEMENT_MAP[ELEMENT_TYPE.TEXTBOX]({
    pageUid: props.pageUid,
    tool: ELEMENT_TYPE.TEXTBOX,
    points: [pos],
    transform: {
      translate: [pos.x, pos.y],
      scale: [1, 1],
      rotate: 0,
    },
    focusOnMount: true,
  });
  coreStore.addElement(textboxElement);
  interactiveLayer.value?.setInteractiveElementTransforms();
}

function getPressure(event: MouseEvent | TouchEvent, tool: ELEMENT_TYPE): number {
  if (tool === ELEMENT_TYPE.PEN) {
    return pageOptions.value.isStylus ? (event as TouchEvent).touches[0]["force"] : 1;
  }

  return 0.5;
}

function getMousePos(
  canvas: HTMLCanvasElement,
  event: MouseEvent | TouchEvent,
  followRuler = false,
  rulerElement?: Moveable
) {
  const rect = canvas.getBoundingClientRect(); // abs. size of element
  const clientX = (event as TouchEvent).touches
    ? (event as TouchEvent).touches[0].clientX
    : (event as MouseEvent).clientX;
  const clientY = (event as TouchEvent).touches
    ? (event as TouchEvent).touches[0].clientY
    : (event as MouseEvent).clientY;
  let inputX = clientX;
  let inputY = clientY;
  let isRulerLine = false;

  if (pageOptions.value.isRulerMode && followRuler && rulerElement) {
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
          const isInside = rulerElement.isInside(searchDirection[0], searchDirection[1]);

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

function getDrawPos(
  canvas: HTMLCanvasElement,
  event: MouseEvent | TouchEvent,
  followRuler = false,
  rulerElement?: Moveable
) {
  const pos = getMousePos(canvas, event, followRuler, rulerElement);
  let cameraX = pageOptions.value.transformMatrix ? pageOptions.value.transformMatrix.e : 0;
  let cameraY = pageOptions.value.transformMatrix ? pageOptions.value.transformMatrix.f : 0;
  const cameraZoom = pageOptions.value.transformMatrix ? pageOptions.value.transformMatrix.a : 1;
  const initMatrixA = pageOptions.value.initTransformMatrix
    ? pageOptions.value.initTransformMatrix.a
    : 1;
  const relativeZoom = initMatrixA / cameraZoom;

  const isInteractiveTool = CANVAS_INTERACTIVE_TOOLS.includes(pageOptions.value.selectedTool);
  if (isInteractiveTool) {
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

function handleClearAll() {
  const lastElementUid = coreStore.lastActiveElementUid(props.pageUid);
  const lastElement = coreStore.elements[lastElementUid];
  if (
    page.value.elementOrder.length === 0 ||
    (page.value.elementOrder.length > 0 && lastElement.tool === ELEMENT_TYPE.CLEAR_ALL)
  ) {
    return;
  }

  const clearElement = new ELEMENT_MAP[ELEMENT_TYPE.CLEAR_ALL]({
    pageUid: props.pageUid,
    tool: ELEMENT_TYPE.CLEAR_ALL,
    points: [
      {
        x: 0,
        y: 0,
      },
      {
        x: coreStore.canvasConfig.width,
        y: coreStore.canvasConfig.height,
      },
    ],
    canvasSettings: {
      strokeColor: TRANSPARENT_COLOR,
      fillColor: { r: 255, g: 255, b: 255, a: 1 },
    } as ICanvasSettings,
  });
  clearElement.cacheElement();
  coreStore.addElement(clearElement);
  drawingLayer.value?.drawElements();
  pageOptions.value.selectedTool = ELEMENT_TYPE.ERASER;
}

function handleCameraZoom(zoomStep: number) {
  // if (typeof pageOptions.value.transformMatrix === "undefined") {
  //   return;
  // }
  // const isInBounds =
  //   zoomStep > 0
  //     ? pageOptions.value.transformMatrix.a < 6
  //     : pageOptions.value.transformMatrix.a > 0.5;
  // if (isInBounds) {
  //   pageOptions.value.transformMatrix.a += zoomStep;
  //   pageOptions.value.transformMatrix.a =
  //     Math.round((pageOptions.value.transformMatrix.a + Number.EPSILON) * 100) / 100;
  //   pageOptions.value.transformMatrix.d = pageOptions.value.transformMatrix.a;
  // }
  // paperLayer.value?.setPaperTransforms();
  // interactiveLayer.value?.setInteractiveElementTransforms();
  // drawingLayer.value?.drawElements();
}

function handleCameraPan(event: MouseEvent | TouchEvent, isStart = false) {
  // if (
  //   typeof pageOptions.value.transformMatrix === "undefined" ||
  //   typeof drawingCanvas.value === "undefined"
  // ) {
  //   return;
  // }
  // const pos = getMousePos(drawingCanvas.value, event);
  // if (isStart) {
  //   activePanCoords.value = [
  //     {
  //       x: pos.x - pageOptions.value.transformMatrix.e,
  //       y: pos.y - pageOptions.value.transformMatrix.f,
  //     },
  //   ];
  // }
  // activePanCoords.value[1] = { x: pos.x, y: pos.y };
  // const transformOrigin = {
  //   x: activePanCoords.value[1].x - activePanCoords.value[0].x,
  //   y: activePanCoords.value[1].y - activePanCoords.value[0].y,
  // };
  // pageOptions.value.transformMatrix.e = transformOrigin.x;
  // pageOptions.value.transformMatrix.f = transformOrigin.y;
  // paperLayer.value?.setPaperTransforms();
  // interactiveLayer.value?.setInteractiveElementTransforms();
  // drawingLayer.value?.drawElements();
}

function handleSurfaceTouchStart(event: MouseEvent | TouchEvent) {
  toolbar.value?.closeAllColorPickers();

  if (pageOptions.value.selectedTool === CANVAS_POINTER_TOOL) {
    pageOptions.value.isPanning = true;
    handleCameraPan(event, true);
    return;
  }

  if (pageOptions.value.selectedTool === CANVAS_PAPER_TOOL) {
    return;
  }

  const selectedTool = pageOptions.value.selectedTool as ELEMENT_TYPE;
  const activeElements = coreStore.activeElements(props.pageUid);

  if (
    activeElements.length === 0 &&
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

  coreStore.setIsStylus(props.pageUid, event);

  if (
    !isDrawingAllowed(true) ||
    typeof drawingCanvas.value === "undefined" ||
    drawingCanvas.value === null
  ) {
    return;
  }

  pageOptions.value.isDrawing = true;

  const strokeColor =
    selectedTool === ELEMENT_TYPE.CUT ? TRANSPARENT_COLOR : selectedStrokeColor.value;
  const fillColor = selectedTool === ELEMENT_TYPE.CUT ? TRANSPARENT_COLOR : selectedFillColor.value;
  const pos = getDrawPos(drawingCanvas.value, event, true, rulerLayer.value?.moveableEl);
  const isRulerLine = pos.isRulerLine;

  const elementProps = {
    pageUid: props.pageUid,
    tool: selectedTool,
    canvasSettings: {
      strokeColor,
      fillColor,
      isRulerLine,
      lineSize: selectedTool === ELEMENT_TYPE.CUT ? 0 : pageOptions.value.selectedToolSize,
      freehandOptions: {
        size: pageOptions.value.selectedToolSize,
        simulatePressure: selectedTool === ELEMENT_TYPE.PEN && !pageOptions.value.isStylus,
        thinning: selectedTool === ELEMENT_TYPE.PEN ? 0.5 : 0,
        streamline: isRulerLine ? 1 : 0.32,
        smoothing: isRulerLine ? 1 : 0.32,
        last: false,
      },
    } as Partial<ICanvasSettings>,
  } as Partial<IElement>;

  const pressure = getPressure(event, selectedTool);
  elementProps.points = [{ x: pos.x, y: pos.y, pressure }];

  if (selectedTool === ELEMENT_TYPE.LINE) {
    elementProps.settings = {
      lineEndSide: pageOptions.value.selectedLineEndSide,
      lineEndStyle: pageOptions.value.selectedLineEndStyle,
    };
  }

  if (
    elementProps.tool === ELEMENT_TYPE.CIRCLE ||
    elementProps.tool === ELEMENT_TYPE.RECTANGLE ||
    elementProps.tool === ELEMENT_TYPE.BLOB ||
    elementProps.tool === ELEMENT_TYPE.ERASER
  ) {
    elementProps.points.push({ x: pos.x, y: pos.y, pressure });
  } else if (elementProps.tool === ELEMENT_TYPE.TRIANGLE) {
    elementProps.points.push({ x: pos.x, y: pos.y, pressure });
    elementProps.points.push({ x: pos.x, y: pos.y, pressure });
  }

  const newElement = new ELEMENT_MAP[selectedTool](elementProps as any);
  coreStore.addElement(newElement);
  drawingLayer.value?.drawElements();
}

function handleSurfaceTouchMove(event: MouseEvent | TouchEvent) {
  if (
    !(pageOptions.value.isPanning || isDrawingAllowed()) ||
    typeof drawingCanvas.value === "undefined" ||
    drawingCanvas.value === null
  ) {
    return;
  }

  event.preventDefault();

  if (pageOptions.value.isPanning) {
    handleCameraPan(event);
    return;
  }

  // const lastElementUid = coreStore.lastActiveElementUid(props.pageUid);
  const lastElementUid = page.value.elementOrder[page.value.elementOrder.length - 1];
  const lastElement = coreStore.elements[lastElementUid] as BaseCanvasElement;
  const isntLineTool = !CANVAS_LINE_TOOLS.includes(lastElement.tool);
  const followRuler = lastElement.canvasSettings.isRulerLine || isntLineTool;
  const pos = getDrawPos(drawingCanvas.value, event, followRuler, rulerLayer.value?.moveableEl);
  const pressure = getPressure(event, lastElement.tool);

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
    lastElement.points = (lastElement as LineElement).calculateLinePoints(pos);
  } else {
    lastElement.points.push({ x: pos.x, y: pos.y, pressure });
  }

  lastElement.canvasSettings.isRulerLine = pos.isRulerLine;

  if (CANVAS_LINE_TOOLS.includes(lastElement.tool)) {
    lastElement.canvasSettings.smoothPoints = lastElement.smoothPoints();
  }

  lastElement.dimensions = lastElement.calculateDimensions();
  coreStore.markDirtyElement(lastElementUid);
  drawingLayer.value?.drawElements();
}

function handleSurfaceTouchEnd(event: MouseEvent | TouchEvent) {
  if (
    pageOptions.value.isInteractiveEditMode ||
    pageOptions.value.isTextboxEditMode ||
    typeof drawingCanvas.value === "undefined"
  ) {
    return;
  }

  if (pageOptions.value.isPanning) {
    handleCameraPan(event);
    pageOptions.value.isPanning = false;
    return;
  }

  if (pageOptions.value.selectedTool === ELEMENT_TYPE.CHECKBOX) {
    const pos = getDrawPos(drawingCanvas.value, event, true, rulerLayer.value?.moveableEl);
    handleAddCheckbox(pos);
    return;
  }

  if (pageOptions.value.selectedTool === ELEMENT_TYPE.TEXTBOX) {
    const pos = getDrawPos(drawingCanvas.value, event, true, rulerLayer.value?.moveableEl);
    handleAddTextbox(pos);
    return;
  }

  if (!isDrawingAllowed() || drawingCanvas.value === null) {
    return;
  }

  // const lastElementUid = coreStore.lastActiveElementUid(props.pageUid);
  const lastElementUid = page.value.elementOrder[page.value.elementOrder.length - 1];
  const lastElement = coreStore.elements[lastElementUid] as BaseCanvasElement;
  lastElement.canvasSettings.freehandOptions.last = true;
  lastElement.dimensions = lastElement.calculateDimensions();

  if (lastElement.dimensions.outerWidth === 0 || lastElement.dimensions.outerHeight === 0) {
    coreStore.removeElement(lastElement);
    pageOptions.value.isDrawing = false;
    return;
  }

  if (lastElement.tool === ELEMENT_TYPE.CUT) {
    pasteLayer.value?.handlePasteStart();
  } else {
    lastElement.cacheElement();
    coreStore.markDirtyElement(lastElementUid);
    drawingLayer.value?.drawElements();
  }
  pageOptions.value.isDrawing = false;
}
function handleUndo() {
  const action = coreStore.history[props.pageUid][coreStore.historyIndex[props.pageUid]];
  const element = coreStore.elements[action.elementUid] as BaseElement;
  let redoPaste = false;
  let redoAddImage = false;

  if (pageOptions.value.isPasteMode) {
    pasteLayer.value?.handleCancelPaste();
  } else if (action.type === HistoryEvent.ADD_IMAGE_START) {
    addImageLayer.value?.handleCancelAddImage();
  } else if (action.type === HistoryEvent.ADD_CANVAS_ELEMENT) {
    redoPaste = element.tool === ELEMENT_TYPE.PASTE;
    redoAddImage = element.tool === ELEMENT_TYPE.IMAGE;
    coreStore.removeElement(element, false);
  } else if (action.type === HistoryEvent.REMOVE_CANVAS_ELEMENT) {
    coreStore.addElement(element, false);
  } else if (action.type === HistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES) {
    element.transform = cloneDeep(action.from);
  }

  coreStore.historyIndex[props.pageUid] -= 1;
  coreStore.markDirtyElement(action.elementUid);

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
  const action = coreStore.history[props.pageUid][coreStore.historyIndex[props.pageUid] + 1];
  const element = coreStore.elements[action.elementUid] as BaseElement;
  let redoPaste = false;
  let redoAddImage = false;

  if (action.type === HistoryEvent.ADD_CANVAS_ELEMENT) {
    redoPaste = element.tool === ELEMENT_TYPE.CUT;
    coreStore.addElement(element, false);
  } else if (action.type === HistoryEvent.REMOVE_CANVAS_ELEMENT) {
    coreStore.removeElement(element, false);
  } else if (action.type === HistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES) {
    element.transform = cloneDeep(action.to);
  } else if (action.type === HistoryEvent.ADD_IMAGE_START) {
    redoAddImage = true;
  }

  coreStore.historyIndex[props.pageUid] += 1;
  coreStore.markDirtyElement(action.elementUid);

  if (redoPaste) {
    pasteLayer.value?.handlePasteStart();
  } else if (redoAddImage) {
    addImageLayer.value?.handleAddImageStart(action.image, false);
  } else {
    pageOptions.value.isPasteMode = false;
    pageOptions.value.isAddImageMode = false;
    drawingLayer.value?.drawElements();
  }
}
</script>

<template>
  <div
    class="canvas-wrapper"
    :style="{
      overflow: pageOptions && pageOptions.isDrawing ? 'hidden' : 'auto',
    }"
  >
    <div class="toolbar">
      <PageToolbar
        ref="toolbar"
        :pageUid="pageUid"
        @update:tool="handleToolChange"
        @action:history:undo="handleUndo"
        @action:history:redo="handleRedo"
        @action:camera:zoom-in="handleCameraZoom"
        @action:camera:zoom-out="handleCameraZoom"
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
      :style="{
        width: `${coreStore.canvasConfig.width}px`,
        height: `${coreStore.canvasConfig.height}px`,
      }"
      @mousedown="handleSurfaceTouchStart"
      @touchstart="handleSurfaceTouchStart"
      @mouseup="handleSurfaceTouchEnd"
      @touchend="handleSurfaceTouchEnd"
      @mousemove="handleSurfaceTouchMove"
      @touchmove="handleSurfaceTouchMove"
    >
      <PageRulerLayer ref="rulerLayer" class="ruler-layer" :pageUid="pageUid" />

      <PageAddImageLayer
        ref="addImageLayer"
        class="image-layer"
        :pageUid="pageUid"
        @redraw="drawingLayer?.drawElements"
      />

      <PagePasteLayer
        ref="pasteLayer"
        class="paste-layer"
        :pageUid="props.pageUid"
        @redraw="drawingLayer?.drawElements"
      />

      <div class="drawing-area">
        <PageInteractiveLayer
          ref="interactiveLayer"
          class="interactive-layer"
          :pageUid="props.pageUid"
        />
        <PageDrawingLayer
          ref="drawingLayer"
          class="drawing-layer"
          :pageUid="props.pageUid"
          @ready="initScene"
        />
      </div>
      <PagePaperLayer ref="paperLayer" class="paper-layer" :pageUid="props.pageUid" />
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
  overflow: auto;
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
  /* width: 100vw;
  height: 100vh; */
}

.drawing-area,
.paste-layer,
.image-layer,
.ruler-layer,
.paper-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.paper-layer {
  z-index: 0;
}

.drawing-area {
  z-index: 1;
}

.ruler-layer {
  z-index: 3;
}

.paste-layer {
  z-index: 4;
}

.image-layer {
  z-index: 4;
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
