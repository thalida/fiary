<script setup lang="ts">
import Konva from "konva";
import { type Ref, ref } from 'vue'
const stage: Ref<any> = ref(null);
const layer: Ref<any> = ref(null);

const configKonva = {
  width: window.innerWidth,
  height: window.innerHeight,
  draggable: false,
}

const mode = 'brush';
let isPaint = false;
let points = [] as any[];
let lines = [] as any[];
const penSize = 40; // 20, 40, 60, 80
let isStylus: boolean | null = null;
let detectedStlyus = false;
const allowFingerIfStylus = false;

function getStrokeWidth(event): number | undefined {
  let strokeWidth;
  if (event.touches && event.touches[0] && typeof event.touches[0]["force"] !== "undefined") {
    let pressure;
    if (isStylus === null) {
      pressure = event.touches[0]["force"];
      isStylus = pressure > 0;
      detectedStlyus = detectedStlyus || isStylus;
    } else if (isStylus) {
      pressure = event.touches[0]["force"];
    } else {
      pressure = 1
    }

    if (detectedStlyus && !isStylus && !allowFingerIfStylus) {
      return;
    }

    strokeWidth = Math.ceil(Math.log(pressure + 1) * penSize);
  } else {
    strokeWidth = Math.ceil(Math.log(2) * penSize);
  }

  if (strokeWidth < 1) strokeWidth = 1;
  return strokeWidth;
}

function handleTouchStart(event) {
  if (stage.value === null || layer.value === null) return;

  isPaint = true;

  const stageNode = stage.value.getNode();
  const layerNode = layer.value.getNode();
  const pos = stageNode.getPointerPosition();
  const strokeWidth = getStrokeWidth(event.evt);

  if (strokeWidth === undefined) return;

  const newLine: Konva.LineConfig = {
    stroke: '#000000',
    strokeWidth,
    globalCompositeOperation:
      mode === 'brush' ? 'source-over' : 'destination-out',
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
  isPaint = false;
  isStylus = null;
}

function handleTouchMove(event) {
  if (!isPaint) {
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

  if (gap <= 1) {
    const newPoints = lastLine.points().concat([pos.x, pos.y]);
    points.push({ x: pos.x, y: pos.y });
    lastLine.points(newPoints);
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
      stroke: '#000000',
      strokeWidth: tweenStroke,
      globalCompositeOperation:
        mode === 'brush' ? 'source-over' : 'destination-out',
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
</style>
