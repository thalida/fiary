<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import cloneDeep from "lodash/cloneDeep";
import { useGesture } from "@vueuse/gesture";
import { interpolate } from "popmotion";
import {
  PageHistoryEvent as HistoryEvent,
  ELEMENT_TYPE,
  CANVAS_POINTER_TOOL,
  CANVAS_PAPER_TOOL,
  CANVAS_LINE_TOOLS,
  TRANSPARENT_COLOR,
  CANVAS_NONDRAWING_TOOLS,
  CANVAS_HAND_TOOL,
} from "@/constants/core";
import type { ICanvasSettings, IElement, IElementPoint, TPrimaryKey } from "@/types/core";
import { ELEMENT_MAP } from "@/models/elements";
import PageInteractiveLayer from "@/components/PageInteractiveLayer.vue";
import PagePaperLayer from "@/components/PagePaperLayer.vue";
import PageDrawingLayer from "@/components/PageDrawingLayer.vue";
import PagePasteLayer from "@/components/PagePasteLayer.vue";
import PageAddImageLayer from "@/components/PageAddImageLayer.vue";
import PageToolbar from "@/components/PageToolbar.vue";
import { useCoreStore } from "@/stores/core";
import type LineElement from "@/models/elements/LineElement";
import type BaseCanvasElement from "@/models/BaseCanvasElement";
import type BaseElement from "@/models/BaseElement";
import { useMotionProperties, useSpring, type PermissiveMotionProperties } from "@vueuse/motion";

console.log("Updated PageScene");
const props = defineProps<{ pageUid: TPrimaryKey }>();
const coreStore = useCoreStore();

const page = computed(() => coreStore.pages[props.pageUid]);

const rootEl = ref<HTMLElement>();
const surfaceEl = ref<HTMLElement>();
const interactiveLayer = ref<typeof PageInteractiveLayer>();
const paperLayer = ref<typeof PagePaperLayer>();
const drawingLayer = ref<typeof PageDrawingLayer>();
const pasteLayer = ref<typeof PagePasteLayer>();
const addImageLayer = ref<typeof PageAddImageLayer>();
const toolbar = ref<typeof PageToolbar>();

const { motionProperties } = useMotionProperties(surfaceEl, {
  x: 0,
  y: 0,
  scale: 1,
});
const { set } = useSpring(motionProperties as Partial<PermissiveMotionProperties>);

const mapper = ref();

const surfaceTransformCss = computed(() => {
  if (typeof page.value === "undefined") {
    return "";
  }

  const translate = `translate(${page.value.transformMatrix.e}px, ${page.value.transformMatrix.f}px)`;
  const scale = `scale(${page.value.transformMatrix.a})`;

  return `${translate} ${scale}`;
});
const selectedFillColor = computed(() => coreStore.selectedFillColor(props.pageUid));
const selectedStrokeColor = computed(() => coreStore.selectedStrokeColor(props.pageUid));

let minZoom = 0.25;
const maxZoom = 4;
function initScene() {
  if (typeof rootEl.value === "undefined") {
    return;
  }

  coreStore.startAutoSave(props.pageUid, drawingLayer.value?.drawingCanvas);

  const rect = rootEl.value.getBoundingClientRect();
  const longestScreenSize = Math.max(rect.width, rect.height) - 100;
  const longestCanvasSide = Math.max(coreStore.canvasConfig.width, coreStore.canvasConfig.height);
  minZoom = longestScreenSize / longestCanvasSide;
  const minSize = longestCanvasSide - longestScreenSize;
  const maxSize = longestCanvasSide * maxZoom;
  mapper.value = interpolate([-minSize, 0, maxSize], [minZoom, 1, maxZoom], {
    clamp: true,
  });
}

function handleSaveBtnClick() {
  coreStore.batchSave(props.pageUid, drawingLayer.value?.drawingCanvas);
}

const surfaceGestureModule = useGesture(
  {
    onDrag: handleSurfaceDrag,
    onPinch: handleSurfacePinch,
    onHover: handleSurfaceHover,
    onWheel: handleSurfaceScroll,
  },
  {
    domTarget: rootEl,
    eventOptions: { passive: false },
  }
);

// Disable viewport pinch zoom on whole app
function cancelEvent(e: Event) {
  e.preventDefault();
}

onBeforeUnmount(() => {
  coreStore.stopAutoSave();
});

function isDrawingAllowed(isDrawingOverride = false) {
  const activelyDrawing = page.value.isDrawing || isDrawingOverride;
  const isOverlayMode =
    page.value.isSwatchOpen ||
    page.value.isPasteMode ||
    page.value.isAddImageMode ||
    page.value.isInteractiveEditMode ||
    page.value.isMovingRuler ||
    page.value.isTextboxEditMode;
  const isNonDrawingTool = CANVAS_NONDRAWING_TOOLS.includes(page.value.selectedTool);
  const stylusAllowed = page.value.detectedStylus && page.value.isStylus;
  const isFingerAllowed = !page.value.isStylus && page.value.allowFingerDrawing;

  return (
    activelyDrawing && !isOverlayMode && !isNonDrawingTool && (stylusAllowed || isFingerAllowed)
  );
}

function handleToolChange() {
  interactiveLayer.value?.reset();

  if (page.value.selectedTool === ELEMENT_TYPE.CLEAR_ALL) {
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
}

function getPressure(event: MouseEvent | TouchEvent, tool: ELEMENT_TYPE): number {
  if (tool === ELEMENT_TYPE.PEN) {
    return page.value.isStylus ? (event as TouchEvent).touches[0]["force"] : 1;
  }

  return 0.5;
}

function getMousePos(canvas: HTMLCanvasElement, event: MouseEvent | TouchEvent) {
  const rect = canvas.getBoundingClientRect(); // abs. size of element
  const clientX = (event as TouchEvent).touches
    ? (event as TouchEvent).touches[0].clientX
    : (event as MouseEvent).clientX;
  const clientY = (event as TouchEvent).touches
    ? (event as TouchEvent).touches[0].clientY
    : (event as MouseEvent).clientY;

  const x = clientX - rect.left;
  const y = clientY - rect.top;
  return { x, y };
}

function getDrawPos(canvas: HTMLCanvasElement, event: MouseEvent | TouchEvent) {
  const pos = getMousePos(canvas, event);
  const cameraZoom = page.value.transformMatrix ? page.value.transformMatrix.a : 1;
  const transformedPos = {
    x: pos.x / cameraZoom,
    y: pos.y / cameraZoom,
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
  page.value.selectedTool = ELEMENT_TYPE.ERASER;
}

async function setSurfaceTransform(transform: { translate?: number[]; scale?: number }) {
  if (typeof surfaceEl.value === "undefined" || typeof rootEl.value === "undefined") {
    return;
  }

  // const nextTransform = {
  //   ...page.value.transformMatrix,
  // };
  if (Array.isArray(transform.translate) && transform.translate.length === 2) {
    page.value.transformMatrix.e = transform.translate[0];
    page.value.transformMatrix.f = transform.translate[1];
  }

  if (typeof transform.scale !== "undefined") {
    page.value.transformMatrix.a = transform.scale;
    page.value.transformMatrix.d = transform.scale;
  }

  set({
    x: page.value.transformMatrix.e,
    y: page.value.transformMatrix.f,
    scale: page.value.transformMatrix.a,
  });

  // page.value.transformMatrix = nextTransform;
}

function handleSurfaceHover({ hovering }: { hovering: boolean }) {
  if (!hovering) {
    window.removeEventListener("wheel", cancelEvent);
    document.removeEventListener("gesturestart", cancelEvent);
    document.removeEventListener("gesturechange", cancelEvent);
    return;
  }
  window.addEventListener("wheel", cancelEvent, { passive: false });
  document.addEventListener("gesturestart", cancelEvent);
  document.addEventListener("gesturechange", cancelEvent);
}

let prevEventWasFirst = false;
let lastEvent: MouseEvent | TouchEvent | null = null;
let lastNumTouches = 0;
function handleSurfaceDrag({
  event,
  movement,
  offset,
  dragging,
  touches,
  down,
  first,
  last,
}: {
  event: MouseEvent | TouchEvent;
  movement: [number, number];
  offset: [number, number];
  dragging: boolean;
  pinching: boolean;
  touches: number;
  down: boolean;
  first: boolean;
  last: boolean;
  intentional: boolean;
}) {
  const target = event.target as HTMLElement;
  const validTarget =
    target.classList.contains("canvas-wrapper") ||
    target.classList.contains("surface") ||
    target.classList.contains("interactive-layer") ||
    target.classList.contains("interactive-elements");

  if (!validTarget || page.value.isInteractiveEditMode) {
    return;
  }

  event.stopPropagation();

  if (first) {
    prevEventWasFirst = true;
    lastEvent = event;
    lastNumTouches = touches;
    return;
  }

  const isSurfaceTarget =
    target.classList.contains("surface") ||
    target.classList.contains("interactive-layer") ||
    target.classList.contains("interactive-elements");

  const isDrawingAllowed =
    page.value.selectedTool !== CANVAS_HAND_TOOL &&
    isSurfaceTarget &&
    lastNumTouches === 1 &&
    touches <= 1;

  if (last) {
    if (isDrawingAllowed && lastEvent !== null) {
      if (prevEventWasFirst) {
        handleSurfaceTouchStart(lastEvent);
      }

      handleSurfaceTouchEnd(lastEvent);
    }
    prevEventWasFirst = false;
    lastEvent = null;
    lastNumTouches = 0;
    return;
  }

  if (page.value.isDrawing || isDrawingAllowed) {
    if (prevEventWasFirst && lastEvent !== null) {
      handleSurfaceTouchStart(lastEvent);
    }

    handleSurfaceTouchMove(event);
    prevEventWasFirst = false;
    lastEvent = event;
    lastNumTouches = touches;
    return;
  }

  setSurfaceTransform({ translate: movement });
  lastEvent = event;
  prevEventWasFirst = false;
  lastNumTouches = touches;

  if (typeof surfaceGestureModule.config.drag === "undefined") {
    return;
  }
  surfaceGestureModule.config.drag.initial = [
    page.value.transformMatrix.e,
    page.value.transformMatrix.f,
  ];
}

function handleSurfacePinch({
  event,
  offset,
  movement,
  pinching,
  dragging,
  touches,
  intentional,
}: {
  event: MouseEvent | TouchEvent;
  offset: [number, number];
  movement: [number, number];
  pinching: boolean;
  dragging: boolean;
  touches: number;
  intentional: boolean;
}) {
  if (!pinching || page.value.isDrawing) {
    return;
  }
  event.stopPropagation();

  const scale = mapper.value(offset[0]);
  setSurfaceTransform({ scale });
}

function handleSurfaceScroll({
  event,
  xy: [x, y],
  wheeling,
}: {
  event: MouseEvent | TouchEvent;
  xy: [number, number];
  wheeling: boolean;
  touches: number;
}) {
  if (!wheeling) {
    return;
  }
  event.stopPropagation();

  setSurfaceTransform({ translate: [-x, -y] });
  surfaceGestureModule.state.wheel.values = [
    -page.value.transformMatrix.e,
    -page.value.transformMatrix.f,
  ];
}

function handleCameraZoom(zoomStep: number) {
  if (typeof page.value.transformMatrix === "undefined") {
    return;
  }

  const nextZoom = page.value.transformMatrix.a + zoomStep;
  const clampedZoom = Math.max(Math.min(nextZoom, maxZoom), minZoom);
  setSurfaceTransform({
    scale: clampedZoom,
  });

  if (typeof surfaceGestureModule.config.drag === "undefined") {
    return;
  }
  surfaceGestureModule.config.drag.initial = [
    page.value.transformMatrix.e,
    page.value.transformMatrix.f,
  ];
}

function handleSurfaceTouchStart(event: MouseEvent | TouchEvent) {
  toolbar.value?.closeAllColorPickers();

  if (
    page.value.selectedTool === CANVAS_POINTER_TOOL ||
    page.value.selectedTool === CANVAS_PAPER_TOOL
  ) {
    return;
  }

  const selectedTool = page.value.selectedTool as ELEMENT_TYPE;
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
    typeof drawingLayer.value?.drawingCanvas === "undefined" ||
    drawingLayer.value?.drawingCanvas === null
  ) {
    return;
  }

  page.value.isDrawing = true;

  const strokeColor =
    selectedTool === ELEMENT_TYPE.CUT ? TRANSPARENT_COLOR : selectedStrokeColor.value;
  const fillColor = selectedTool === ELEMENT_TYPE.CUT ? TRANSPARENT_COLOR : selectedFillColor.value;
  const pos = getDrawPos(drawingLayer.value?.drawingCanvas, event);

  const elementProps = {
    pageUid: props.pageUid,
    tool: selectedTool,
    canvasSettings: {
      strokeColor,
      fillColor,
      isRulerLine: false,
      lineSize: selectedTool === ELEMENT_TYPE.CUT ? 0 : page.value.selectedToolSize,
      freehandOptions: {
        size: page.value.selectedToolSize,
        simulatePressure: selectedTool === ELEMENT_TYPE.PEN && !page.value.isStylus,
        thinning: selectedTool === ELEMENT_TYPE.PEN ? 0.5 : 0,
        streamline: 0.01,
        smoothing: 0.66,
        last: false,
      },
    } as Partial<ICanvasSettings>,
  } as Partial<IElement>;

  const pressure = getPressure(event, selectedTool);
  elementProps.points = [{ x: pos.x, y: pos.y, pressure }];

  if (selectedTool === ELEMENT_TYPE.LINE) {
    elementProps.settings = {
      lineEndSide: page.value.selectedLineEndSide,
      lineEndStyle: page.value.selectedLineEndStyle,
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
    !isDrawingAllowed() ||
    typeof drawingLayer.value?.drawingCanvas === "undefined" ||
    drawingLayer.value?.drawingCanvas === null
  ) {
    return;
  }

  event.preventDefault();

  const lastElementUid = page.value.elementOrder[page.value.elementOrder.length - 1];
  const lastElement = coreStore.elements[lastElementUid] as BaseCanvasElement;
  const pos = getDrawPos(drawingLayer.value?.drawingCanvas, event);
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

  if (CANVAS_LINE_TOOLS.includes(lastElement.tool)) {
    lastElement.canvasSettings.smoothPoints = lastElement.smoothPoints();
  }

  lastElement.dimensions = lastElement.calculateDimensions();
  coreStore.markDirtyElement(lastElementUid);
  drawingLayer.value?.drawElements();
}

function handleSurfaceTouchEnd(event: MouseEvent | TouchEvent) {
  if (
    page.value.isInteractiveEditMode ||
    page.value.isTextboxEditMode ||
    typeof drawingLayer.value?.drawingCanvas === "undefined"
  ) {
    return;
  }

  if (page.value.selectedTool === ELEMENT_TYPE.CHECKBOX) {
    const pos = getDrawPos(drawingLayer.value?.drawingCanvas, event);
    handleAddCheckbox(pos);
    return;
  }

  if (page.value.selectedTool === ELEMENT_TYPE.TEXTBOX) {
    const pos = getDrawPos(drawingLayer.value?.drawingCanvas, event);
    handleAddTextbox(pos);
    return;
  }

  if (!isDrawingAllowed() || drawingLayer.value?.drawingCanvas === null) {
    return;
  }

  // const lastElementUid = coreStore.lastActiveElementUid(props.pageUid);
  const lastElementUid = page.value.elementOrder[page.value.elementOrder.length - 1];
  const lastElement = coreStore.elements[lastElementUid] as BaseCanvasElement;
  lastElement.canvasSettings.freehandOptions.last = true;
  lastElement.dimensions = lastElement.calculateDimensions();

  if (lastElement.dimensions.outerWidth === 0 || lastElement.dimensions.outerHeight === 0) {
    coreStore.removeElement(lastElement);
    page.value.isDrawing = false;
    return;
  }

  if (lastElement.tool === ELEMENT_TYPE.CUT) {
    pasteLayer.value?.handlePasteStart();
  } else {
    lastElement.cacheElement();
    coreStore.markDirtyElement(lastElementUid);
    drawingLayer.value?.drawElements();
  }
  page.value.isDrawing = false;
}

function handleUndo() {
  const action = coreStore.history[props.pageUid][coreStore.historyIndex[props.pageUid]];
  const element = coreStore.elements[action.elementUid] as BaseElement;
  let undoPaste = false;
  let undoAddImage = false;
  let undoClearAll = false;

  if (page.value.isPasteMode) {
    pasteLayer.value?.handleCancelPaste();
  } else if (action.type === HistoryEvent.ADD_IMAGE_START) {
    addImageLayer.value?.handleCancelAddImage();
  } else if (action.type === HistoryEvent.ADD_CANVAS_ELEMENT) {
    undoPaste = element.tool === ELEMENT_TYPE.PASTE;
    undoAddImage = element.tool === ELEMENT_TYPE.IMAGE;
    undoClearAll = element.tool === ELEMENT_TYPE.CLEAR_ALL;
    coreStore.removeElement(element, false);
  } else if (action.type === HistoryEvent.REMOVE_CANVAS_ELEMENT) {
    coreStore.addElement(element, false);
  } else if (action.type === HistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES) {
    element.transform = cloneDeep(action.from);
  }

  coreStore.historyIndex[props.pageUid] -= 1;
  coreStore.markDirtyElement(action.elementUid);

  if (undoPaste) {
    pasteLayer.value?.handlePasteStart();
  } else if (undoAddImage) {
    drawingLayer.value?.drawElements();
    addImageLayer.value?.handleAddImageStart(action.image, false);
  } else if (undoClearAll) {
    for (const elementUid of action.elements) {
      coreStore.addElement(coreStore.elements[elementUid], false);
    }
    drawingLayer.value?.drawElements();
  } else {
    drawingLayer.value?.drawElements();
  }
}

function handleRedo() {
  const action = coreStore.history[props.pageUid][coreStore.historyIndex[props.pageUid] + 1];
  const element = coreStore.elements[action.elementUid] as BaseElement;
  let redoPaste = false;
  let redoAddImage = false;
  let redoClearAll = false;

  if (action.type === HistoryEvent.ADD_CANVAS_ELEMENT) {
    redoPaste = element.tool === ELEMENT_TYPE.CUT;
    redoClearAll = element.tool === ELEMENT_TYPE.CLEAR_ALL;
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
  } else if (redoClearAll) {
    for (const elementUid of action.elements) {
      coreStore.removeElement(coreStore.elements[elementUid], false);
    }
    drawingLayer.value?.drawElements();
  } else {
    page.value.isPasteMode = false;
    page.value.isAddImageMode = false;
    drawingLayer.value?.drawElements();
  }
}
</script>

<template>
  <div ref="rootEl" class="canvas-wrapper">
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
        @action:save-btn:click="handleSaveBtnClick"
      />
    </div>
    <div
      ref="surfaceEl"
      class="surface"
      :style="{
        width: `${coreStore.canvasConfig.width}px`,
        height: `${coreStore.canvasConfig.height}px`,
      }"
    >
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
          v-if="toolbar"
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
  overflow: hidden;
  background: #333;
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
  transform-origin: left top;
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
