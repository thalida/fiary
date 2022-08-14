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
let points = [] as any[];
let lines = [] as any[];
let isStylus = ref(false);
let detectedStlyus = ref(false);
const allowFingerIfStylus = ref(false);

enum Tool {
  ERASER = 0,
  PEN = 1,
  MARKER = 2,
}
const supportedTools = {
  [Tool.PEN]: { label: 'Pen' },
  [Tool.MARKER]: { label: 'Marker' },
  [Tool.ERASER]: { label: 'Eraser' },
}
const toolOrder = [Tool.PEN, Tool.MARKER, Tool.ERASER];
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

  return 'source-over';
});


function setupIsStylus(event) {
  let force = event.touches ? event.touches[0]["force"] : 0;
  isStylus.value = force > 0;
  detectedStlyus.value = detectedStlyus.value || isStylus.value;
}

function getStrokeWidth(event, isTouchStart = false): number | undefined {
  let strokeWidth;
  let pressure;

  if (isTouchStart) {
    setupIsStylus(event);
  }

  if (detectedStlyus.value && !isStylus.value && !allowFingerIfStylus.value) {
    return;
  }

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

  return 1;
}


function handleTouchStart(event) {
  if (stage.value === null || layer.value === null) return;

  isDrawing = true;

  const stageNode = stage.value.getNode();
  const layerNode = layer.value.getNode();
  const pos = stageNode.getPointerPosition();
  const strokeWidth = getStrokeWidth(event.evt, true);

  if (strokeWidth === undefined) return;

  const newLine: Konva.LineConfig = {
    stroke: selectedColor.value,
    opacity: getOpacity(),
    strokeWidth,
    globalCompositeOperation: globalCompositeOperation.value,
    lineCap: 'round',
    lineJoin: 'round',
    points: [pos.x, pos.y, pos.x, pos.y],
    bezier: true,
    perfectDrawEnabled: false,
    shadowForStrokeEnabled: false,
    listening: false,
  };

  points = [{ x: pos.x, y: pos.y }, { x: pos.x, y: pos.y }];

  const konvaLine = new Konva.Line(newLine);
  lines.push(konvaLine);
  layerNode.add(konvaLine);
}

function handleTouchEnd() {
  isDrawing = false;
}

function handleTouchMove(event) {
  if (!isDrawing) {
    return;
  }

  if (stage.value === null || layer.value === null) return;

  const newStrokeWidth = getStrokeWidth(event.evt);
  if (newStrokeWidth === undefined) return;

  event.evt.preventDefault();

  const stageNode = stage.value.getNode();
  const layerNode = layer.value.getNode();
  const pos = stageNode.getPointerPosition();
  const lastLine = lines[lines.length - 1];

  const currStrokeWidth = lastLine.strokeWidth();
  const gap = Math.abs(newStrokeWidth - currStrokeWidth);

  if (selectedTool.value !== Tool.PEN || gap <= 1) {
    const lastPoint = points[points.length - 1];

    const isSamePoint = lastPoint.x === pos.x && lastPoint.y === pos.y;
    if (isSamePoint) {
      return;
    }

    if (selectedTool.value !== Tool.PEN) {
      lastLine.strokeWidth(newStrokeWidth);
    }

    let newPoints = lastLine.points().concat([pos.x, pos.y]);
    lastLine.points(newPoints);
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

    newPoints = newPoints.concat([
      secndLastPoints.x,
      secndLastPoints.y,
      lastPoints.x,
      lastPoints.y,
      pos.x,
      pos.y,
    ]);

    let tweenStroke = (currStrokeWidth + newStrokeWidth) / 2;

    const connectorLine: Konva.LineConfig = {
      stroke: selectedColor.value,
      opacity: getOpacity(),
      strokeWidth: tweenStroke,
      globalCompositeOperation: globalCompositeOperation.value,
      lineCap: 'round',
      lineJoin: 'round',
      points: newPoints,
      bezier: true,
      perfectDrawEnabled: false,
      shadowForStrokeEnabled: false,
      listening: false,
    };

    const konvaConnectorLine = new Konva.Line(connectorLine);
    points.push({ x: pos.x, y: pos.y });
    lines.push(konvaConnectorLine);
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
      <label><input type="checkbox" v-model="allowFingerIfStylus" /> finger?</label>
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
