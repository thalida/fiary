<script setup lang="ts">
import Konva from "konva";
import { Ref, ref } from 'vue'
const stage: Ref<any> = ref(null);
const layer: Ref<any> = ref(null);

const configKonva = {
  width: 800,
  height: 800
}

const mode = 'brush';
let isPaint = false;
let lines = [] as any[];

function handleTouchStart() {
  if (stage.value === null || layer.value === null) return;

  isPaint = true;

  const stageNode = stage.value.getNode();
  const layerNode = layer.value.getNode();
  const pos = stageNode.getPointerPosition();
  const newLine: Konva.LineConfig = {
    stroke: '#000000',
    strokeWidth: 10,
    globalCompositeOperation:
      mode === 'brush' ? 'source-over' : 'destination-out',
    // round cap for smoother lines
    lineCap: 'round',
    lineJoin: 'round',
    // add point twice, so we have some drawings even on a simple click
    points: [pos.x, pos.y, pos.x, pos.y],
    tension: 0.5,
  };

  const konvaLine = new Konva.Line(newLine);
  lines.push(konvaLine);
  layerNode.add(konvaLine);
}

function handleTouchEnd() {
  isPaint = false;
}

function handleTouchMove(event) {
  if (!isPaint) {
    return;
  }

  if (stage.value === null || layer.value === null) return;

  // prevent scrolling on touch devices
  event.evt.preventDefault();

  const stageNode = stage.value.getNode();
  const pos = stageNode.getPointerPosition();
  const lastLine = lines[lines.length - 1];
  const newPoints = lastLine.points().concat([pos.x, pos.y]);
  lastLine.points(newPoints);
}

</script>

<template>
  <div class="canvas">
    <v-stage ref="stage" :config="configKonva" @mousedown="handleTouchStart" @touchstart="handleTouchStart"
      @mouseup="handleTouchEnd" @touchend="handleTouchEnd" @mousemove="handleTouchMove" @touchmove="handleTouchMove">
      <v-layer ref="layer">
      </v-layer>
    </v-stage>
  </div>
</template>

<style scoped>
.canvas {
  border: 2px solid red;
}
</style>
