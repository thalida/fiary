<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import cloneDeep from "lodash/cloneDeep";
import type Moveable from "moveable";
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

const rootEl = ref<HTMLElement>();
const surfaceEl = ref<HTMLElement>();
const interactiveLayer = ref<typeof PageInteractiveLayer>();
const paperLayer = ref<typeof PagePaperLayer>();
const drawingLayer = ref<typeof PageDrawingLayer>();
const pasteLayer = ref<typeof PagePasteLayer>();
const addImageLayer = ref<typeof PageAddImageLayer>();
const rulerLayer = ref<typeof PageRulerLayer>();
const toolbar = ref<typeof PageToolbar>();

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
  coreStore.batchSaveElements(props.pageUid, drawingLayer.value?.drawingCanvas);
}

const surfaceGestureModule = useGesture(
  {
    onDrag: handleSurfaceDrag,
    onPinch: handleSurfacePinch,
    onHover: handleSurfaceHover,
    onWheel: handleSurfaceScroll,
  },
  {
    domTarget: surfaceEl,
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

  if (page.value.isRulerMode && followRuler && rulerElement) {
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

async function setSurfaceTransform(transform: { translate?: number[]; scale?: number[] }) {
  if (typeof surfaceEl.value === "undefined" || typeof rootEl.value === "undefined") {
    return;
  }

  const nextTransform = {
    ...page.value.transformMatrix,
  };
  if (typeof transform.translate !== "undefined") {
    nextTransform.e = transform.translate[0];
    nextTransform.f = transform.translate[1];
  }
  if (typeof transform.scale !== "undefined") {
    nextTransform.a = transform.scale[0];
    nextTransform.d = transform.scale[1];
  }

  const rootRect = rootEl.value.getBoundingClientRect();
  const surfaceRect = surfaceEl.value.getBoundingClientRect();

  const buffer = 50;
  let x = nextTransform.e;
  let y = nextTransform.f;
  const x_boundary = surfaceRect.width - rootRect.width + buffer;
  x = Math.max(x, -x_boundary);
  x = Math.min(x, buffer);

  const y_boundary = surfaceRect.height - rootRect.height + buffer;
  y = Math.max(y, -y_boundary);
  y = Math.min(y, buffer);

  nextTransform.e = x;
  nextTransform.f = y;

  page.value.transformMatrix = nextTransform;
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

function handleSurfaceDrag({
  movement: [x, y],
  dragging,
}: {
  movement: [number, number];
  dragging: boolean;
}) {
  if (!dragging || page.value.selectedTool !== CANVAS_HAND_TOOL) {
    return;
  }

  setSurfaceTransform({ translate: [x, y] });

  if (typeof surfaceGestureModule.config.drag === "undefined") {
    return;
  }
  surfaceGestureModule.config.drag.initial = [
    page.value.transformMatrix.e,
    page.value.transformMatrix.f,
  ];
}

function handleSurfacePinch({ offset, pinching }: { offset: [number, number]; pinching: boolean }) {
  if (!pinching || page.value.isDrawing) {
    return;
  }

  const mappedValue = mapper.value(offset[0]);
  const scale = [mappedValue, mappedValue];

  setSurfaceTransform({ scale });

  if (typeof surfaceGestureModule.config.drag === "undefined") {
    return;
  }
  surfaceGestureModule.config.drag.initial = [
    page.value.transformMatrix.e,
    page.value.transformMatrix.f,
  ];
}

function handleSurfaceScroll({
  xy: [x, y],
  wheeling,
}: {
  xy: [number, number];
  wheeling: boolean;
}) {
  if (!wheeling) {
    return;
  }

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
    scale: [clampedZoom, clampedZoom],
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

  if (page.value.selectedTool === CANVAS_POINTER_TOOL) {
    return;
  }

  if (page.value.selectedTool === CANVAS_PAPER_TOOL) {
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
  const pos = getDrawPos(
    drawingLayer.value?.drawingCanvas,
    event,
    true,
    rulerLayer.value?.moveableEl
  );
  const isRulerLine = pos.isRulerLine;

  const elementProps = {
    pageUid: props.pageUid,
    tool: selectedTool,
    canvasSettings: {
      strokeColor,
      fillColor,
      isRulerLine,
      lineSize: selectedTool === ELEMENT_TYPE.CUT ? 0 : page.value.selectedToolSize,
      freehandOptions: {
        size: page.value.selectedToolSize,
        simulatePressure: selectedTool === ELEMENT_TYPE.PEN && !page.value.isStylus,
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

  // const lastElementUid = coreStore.lastActiveElementUid(props.pageUid);
  const lastElementUid = page.value.elementOrder[page.value.elementOrder.length - 1];
  const lastElement = coreStore.elements[lastElementUid] as BaseCanvasElement;
  const isntLineTool = !CANVAS_LINE_TOOLS.includes(lastElement.tool);
  const followRuler = lastElement.canvasSettings.isRulerLine || isntLineTool;
  const pos = getDrawPos(
    drawingLayer.value?.drawingCanvas,
    event,
    followRuler,
    rulerLayer.value?.moveableEl
  );
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
    page.value.isInteractiveEditMode ||
    page.value.isTextboxEditMode ||
    typeof drawingLayer.value?.drawingCanvas === "undefined"
  ) {
    return;
  }

  if (page.value.selectedTool === ELEMENT_TYPE.CHECKBOX) {
    const pos = getDrawPos(
      drawingLayer.value?.drawingCanvas,
      event,
      true,
      rulerLayer.value?.moveableEl
    );
    handleAddCheckbox(pos);
    return;
  }

  if (page.value.selectedTool === ELEMENT_TYPE.TEXTBOX) {
    const pos = getDrawPos(
      drawingLayer.value?.drawingCanvas,
      event,
      true,
      rulerLayer.value?.moveableEl
    );
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
        transform: surfaceTransformCss,
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
