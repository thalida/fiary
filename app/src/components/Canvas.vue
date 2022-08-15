<script setup lang="ts">
import Konva from "konva";
import { type Ref, ref, computed } from 'vue'
const stage: Ref<any> = ref(null);
const layer: Ref<any> = ref(null);

const configKonva = {
  width: window.innerWidth,
  height: window.innerHeight,
  draggable: false,
}

const mode = 'brush';

let isDrawing = false;
let lines = [] as any[];
let points = [] as any[];
let maxPointPosition: any = null;
let isStylus = ref(false);
let detectedStlyus = ref(false);
const allowFingerDrawing = ref(true);

enum Tool {
  ERASER = 0,
  PEN = 1,
  MARKER = 2,
  HIGHLIGHTER = 3,
  BLOB = 10,
}
const supportedTools = {
  [Tool.PEN]: { label: 'Pen' },
  [Tool.MARKER]: { label: 'Marker' },
  [Tool.HIGHLIGHTER]: { label: 'Highlighter' },
  [Tool.BLOB]: { label: 'Blob' },
  [Tool.ERASER]: { label: 'Eraser' },
}
const toolOrder = [Tool.PEN, Tool.MARKER, Tool.HIGHLIGHTER, Tool.BLOB, Tool.ERASER];
const selectedTool = ref(Tool.PEN);

const penSizes = [5, 10, 20, 40, 60];
const penSize = ref(40); // 20, 40, 60, 80

const colors = [
  '#000000',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#00ffff',
  '#ff00ff',
  '#ffffff',
  [0, '#ff0000', 1, '#0000ff'],
  [0, '#00ff00', 1, '#ff0000'],
  [0, '#0000ff', 1, '#00ff00'],
];
const selectedColor = ref(colors[0]);

const compositionOptions = [
  'source-over',
  'source-in',
  'source-out',
  'source-atop',
  'destination-over',
  'destination-in',
  'destination-out',
  'destination-atop',
  'lighter',
  'copy',
  'xor',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
];
const selectedComposition = ref(compositionOptions[0]);

const globalCompositeOperation = computed(() => {
  if (selectedTool.value === Tool.ERASER) {
    return 'destination-out';
  }

  if (selectedTool.value === Tool.MARKER) {
    return 'multiply';
  }

  if (selectedTool.value === Tool.HIGHLIGHTER) {
    return 'lighten';
  }

  return 'source-over';
});


function setupIsStylus(event) {
  let force = event.touches ? event.touches[0]["force"] : 0;
  isStylus.value = force > 0;
  detectedStlyus.value = detectedStlyus.value || isStylus.value;
}

function isDrawingAllowed() {
  if (detectedStlyus.value && !isStylus.value && !allowFingerDrawing.value) {
    return false
  }

  return true;
}

function getStrokeWidth(event, isTouchStart = false): number {
  let strokeWidth;
  let pressure;

  if (isTouchStart) {
    pressure = event.touches ? event.touches[0]["force"] : 0;
  } else if (selectedTool.value === Tool.PEN && isStylus.value) {
    pressure = event.touches[0]["force"];
  } else {
    pressure = 1;
  }

  strokeWidth = Math.ceil(Math.log(pressure + 1) * penSize.value);
  if (strokeWidth < 1) strokeWidth = 1;
  return strokeWidth;
}

function getOpacity(): number {
  if (selectedTool.value === Tool.MARKER) {
    return 0.9;
  }

  if (selectedTool.value === Tool.HIGHLIGHTER) {
    return 0.75;
  }

  return 1;
}

function lineSceneFunc(context, shape) {
  const drawPoints = shape.attrs.points;
  const numPoints = drawPoints.length;

  if (numPoints === 0) {
    return;
  }

  context.beginPath();
  context.moveTo(drawPoints[0], drawPoints[1]);

  let n = 2;

  while (n < numPoints) {
    context.bezierCurveTo(
      drawPoints[n++],
      drawPoints[n++],
      drawPoints[n++],
      drawPoints[n++],
      drawPoints[n++],
      drawPoints[n++]
    );
  }

  if (shape.attrs.closed) {
    context.closePath();
    context.fillStrokeShape(shape);
  } else {
    context.strokeShape(shape);
  }
}


function handleTouchStart(event) {
  if (stage.value === null || layer.value === null) return;

  isDrawing = true;

  setupIsStylus(event.evt);

  if (!isDrawingAllowed()) return;

  const stageNode = stage.value.getNode();
  const layerNode = layer.value.getNode();
  const pos = stageNode.getPointerPosition();
  const strokeWidth = getStrokeWidth(event.evt, true);
  const opacity = getOpacity();

  // points = [pos.x, pos.y, pos.x, pos.y];
  points = [{ x: pos.x, y: pos.y }];

  const newLine: Konva.LineConfig = {
    strokeWidth,
    opacity,
    globalCompositeOperation: globalCompositeOperation.value,
    lineCap: 'round',
    lineJoin: 'round',
    points: [pos.x, pos.y],
    bezier: false,
    closed: selectedTool.value === Tool.BLOB,
    perfectDrawEnabled: false,
    shadowForStrokeEnabled: false,
    listening: false,
    // sceneFunc: lineSceneFunc,
  };

  if (Array.isArray(selectedColor.value)) {
    newLine.fillLinearGradientColorStops = selectedColor.value;
    newLine.fillLinearGradientStartPoint = { x: pos.x, y: pos.y }
    newLine.fillLinearGradientEndPoint = { x: pos.x, y: pos.y }

    newLine.strokeLinearGradientColorStops = selectedColor.value;
    newLine.strokeLinearGradientStartPoint = { x: pos.x, y: pos.y }
    newLine.strokeLinearGradientEndPoint = { x: pos.x, y: pos.y }
  } else {
    newLine.fill = selectedColor.value;
    newLine.stroke = selectedColor.value;
  }

  const konvaLine = new Konva.Line(newLine);
  lines.push({
    konva: konvaLine,
    segments: [] as any[],
  });
  layerNode.add(konvaLine);
}

function handleTouchEnd() {
  if (!isDrawing) {
    return;
  }

  if (stage.value === null || layer.value === null) return;

  const stageNode = stage.value.getNode();
  const pos = stageNode.getPointerPosition();
  const lastLine = lines[lines.length - 1];
  const anchorLine = (lastLine.segments.length === 0) ? lastLine.konva : lastLine.segments[lastLine.segments.length - 1];

  let newPoints = anchorLine.points().concat([pos.x, pos.y]).slice();
  anchorLine.points(newPoints);

  isDrawing = false;
  maxPointPosition = null;
  points = [];

  lastLine.konva.cache();

  for (let i = 0; i < lastLine.segments.length; i++) {
    const segment = lastLine.segments[i];
    segment.cache();
  }
}

function handleTouchMove(event) {
  if (!isDrawing) {
    return;
  }

  if (stage.value === null || layer.value === null) return;

  if (!isDrawingAllowed()) return;


  event.evt.preventDefault();

  const stageNode = stage.value.getNode();
  const layerNode = layer.value.getNode();
  const pos = stageNode.getPointerPosition();
  const lastLine = lines[lines.length - 1];
  const anchorLine = (lastLine.segments.length === 0) ? lastLine.konva : lastLine.segments[lastLine.segments.length - 1];

  const currStrokeWidth = anchorLine.strokeWidth();
  const newStrokeWidth = getStrokeWidth(event.evt);
  const gap = Math.abs(newStrokeWidth - currStrokeWidth);

  if (maxPointPosition !== null) {
    const newPoint = points[points.length - 1];
    if (newPoint.x > maxPointPosition.x) {
      maxPointPosition.x = newPoint.x;
    }
    if (newPoint.y > maxPointPosition.y) {
      maxPointPosition.y = newPoint.y;
    }
  } else {
    maxPointPosition = { x: pos.x, y: pos.y };
  }

  if (selectedTool.value !== Tool.PEN || gap <= 1) {
    const lastPoint = points[points.length - 1];

    const isSamePoint = lastPoint.x === pos.x && lastPoint.y === pos.y;
    if (isSamePoint) {
      return;
    }

    if (selectedTool.value !== Tool.PEN) {
      anchorLine.strokeWidth(newStrokeWidth);
    }

    if (Array.isArray(selectedColor.value)) {
      anchorLine.fillLinearGradientEndPoint(maxPointPosition);
      anchorLine.strokeLinearGradientEndPoint(maxPointPosition);
    }

    let newPoints = anchorLine.points().concat([pos.x, pos.y]);
    anchorLine.points(newPoints);
    points.push({ x: pos.x, y: pos.y });
  } else {
    const lastPoints = points[points.length - 1];
    const secndLastPoints = points[points.length - 2];
    const thirdLastPoints = points[points.length - 3];

    let newPoints = [] as any[];
    if (thirdLastPoints) {
      newPoints = [
        thirdLastPoints.x,
        thirdLastPoints.y,
      ];
    }

    if (secndLastPoints) {
      newPoints = newPoints.concat([
        secndLastPoints.x,
        secndLastPoints.y,
      ]);
    }

    if (lastPoints) {
      newPoints = newPoints.concat([
        lastPoints.x,
        lastPoints.y,
      ]);
    }

    newPoints = newPoints.concat([
      pos.x,
      pos.y,
    ]);

    let tweenStroke = (currStrokeWidth + newStrokeWidth) / 2;

    const connectorLine: Konva.LineConfig = {
      opacity: getOpacity(),
      strokeWidth: tweenStroke,
      globalCompositeOperation: globalCompositeOperation.value,
      lineCap: 'round',
      lineJoin: 'round',
      points: newPoints.slice(),
      bezier: true,
      perfectDrawEnabled: false,
      shadowForStrokeEnabled: false,
      listening: false,
      // sceneFunc: lineSceneFunc,
    };

    if (Array.isArray(selectedColor.value)) {
      connectorLine.fillLinearGradientColorStops = selectedColor.value;
      connectorLine.fillLinearGradientStartPoint = points[0];
      connectorLine.fillLinearGradientEndPoint = maxPointPosition;

      connectorLine.strokeLinearGradientColorStops = selectedColor.value;
      connectorLine.strokeLinearGradientStartPoint = points[0];
      connectorLine.strokeLinearGradientEndPoint = maxPointPosition;
    } else {
      connectorLine.fill = selectedColor.value;
      connectorLine.stroke = selectedColor.value;
    }

    const konvaConnectorLine = new Konva.Line(connectorLine);
    points.push({ x: pos.x, y: pos.y });

    if (Array.isArray(selectedColor.value)) {
      for (let i = 0; i < lastLine.segments.length; i += 1) {
        const segment = lastLine.segments[i];

        segment.fillLinearGradientEndPoint(maxPointPosition);
        segment.strokeLinearGradientEndPoint(maxPointPosition);
      }
    }

    lastLine.segments.push(konvaConnectorLine);
    layerNode.add(konvaConnectorLine);
  }
}

</script>

<template>
  <div class="canvas">
    <div class="tools">
      <select v-model="selectedTool">
        <option v-for="tool in toolOrder" :key="tool" :value="tool">
          {{ supportedTools[tool].label }}
        </option>
      </select>
      <select v-model="penSize">
        <option v-for="size in penSizes" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
      <select v-model="selectedColor">
        <option v-for="color in colors" :key="color" :value="color">
          {{ color }}
        </option>
      </select>
      <select v-model="selectedComposition">
        <option v-for="composition in compositionOptions" :key="composition" :value="composition">
          {{ composition }}
        </option>
      </select>
      <label><input type="checkbox" v-model="detectedStlyus" :disabled="true" /> Detected Stylus?</label>
      <label><input type="checkbox" v-model="isStylus" :disabled="true" /> isStylus?</label>
      <label><input type="checkbox" v-model="allowFingerDrawing" /> finger?</label>
    </div>
    <v-stage ref="stage" :config="configKonva" @mousedown="handleTouchStart" @touchstart="handleTouchStart"
      @mouseup="handleTouchEnd" @touchend="handleTouchEnd" @mousemove="handleTouchMove" @touchmove="handleTouchMove">
      <v-layer ref="layer"></v-layer>
    </v-stage>
  </div>
</template>

<style scoped>
.canvas {
  border: 2px solid red;
}

.tools {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}
</style>
