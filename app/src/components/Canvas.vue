<script setup lang="ts">
import { getStroke } from 'perfect-freehand'
import { type Ref, ref, computed, watchEffect, onMounted } from 'vue'

const canvas = ref<HTMLCanvasElement>()
const canvasConfig = ref({
  width: window.innerWidth,
  height: window.innerHeight,
})

onMounted(() => {
  const dpi = window.devicePixelRatio;
  // const canvasRef = canvas.value;
  const ctx = canvas.value.getContext('2d')

  canvas.value.width = canvasConfig.value.width * dpi;
  canvas.value.height = canvasConfig.value.height * dpi;

  canvas.value.style.width = `${canvasConfig.value.width}px`;
  canvas.value.style.height = `${canvasConfig.value.height}px`;

  ctx.scale(dpi, dpi);
})

const canvasElements: any[] = [];

let isDrawing = false
let isStylus = ref(false);
let detectedStlyus = ref(false);
const allowFingerDrawing = ref(true);

enum Tool {
  ERASER = 0,
  PEN = 10,
  MARKER = 11,
  HIGHLIGHTER = 12,
  BLOB = 20,
  CIRCLE = 30,
}
const supportedTools = {
  [Tool.PEN]: { label: 'Pen' },
  [Tool.MARKER]: { label: 'Marker' },
  [Tool.HIGHLIGHTER]: { label: 'Highlighter' },
  [Tool.BLOB]: { label: 'Blob' },
  [Tool.CIRCLE]: { label: 'Circle' },
  [Tool.ERASER]: { label: 'Eraser' },
}
const toolOrder = [Tool.PEN, Tool.MARKER, Tool.HIGHLIGHTER, Tool.BLOB, Tool.CIRCLE, Tool.ERASER];
const selectedTool = ref(Tool.PEN);
const lineTools = [Tool.PEN, Tool.MARKER, Tool.HIGHLIGHTER];

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


function checkIsStylus(event) {
  let force = event.touches ? event.touches[0]["force"] : 0;
  isStylus.value = force > 0;
  detectedStlyus.value = detectedStlyus.value || isStylus.value;
}

function isDrawingAllowed() {
  if (!isDrawing || (detectedStlyus.value && !isStylus.value && !allowFingerDrawing.value)) {
    return false
  }

  return true;
}

function getPressure(event): number {
  if (selectedTool.value === Tool.PEN) {
    return isStylus.value ? event.touches[0]["force"] : 0.5;
  }

  return 0.5;
}

function getComposition() {
  if (selectedTool.value === Tool.ERASER) {
    return 'destination-out';
  }

  if (selectedTool.value === Tool.MARKER) {
    return 'hue';
  }

  if (selectedTool.value === Tool.HIGHLIGHTER) {
    return 'hard-light';
  }

  return 'source-over';
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

function getMousePos(canvas, event) {
  const rect = canvas.getBoundingClientRect(); // abs. size of element
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;

  return {
    x: (clientX - rect.left),
    y: (clientY - rect.top)
  }
}

function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return ''

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q']
  )

  d.push('Z')
  return d.join(' ')
}

function drawElements(canvas, elements) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < elements.length; i += 1) {
    const element = elements[i];
    const points = element.points.slice();
    const numPoints = points.length;
    const minX = Math.min(...points.map(({ x }: { x: number }) => x));
    const minY = Math.min(...points.map(({ y }: { y: number }) => y));
    const maxX = Math.max(...points.map(({ x }: { x: number }) => x));
    const maxY = Math.max(...points.map(({ y }: { y: number }) => y));

    ctx.save();

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = element.composition;
    ctx.globalAlpha = element.opacity;
    ctx.strokeStyle = element.color;
    ctx.fillStyle = element.color;

    if (Array.isArray(element.color)) {
      const gradient = ctx.createLinearGradient(minX, minY, maxX, maxY);
      for (let j = 0; j < element.color.length; j += 2) {
        gradient.addColorStop(element.color[j], element.color[j + 1]);
      }
      ctx.strokeStyle = gradient;
      ctx.fillStyle = gradient;
    } else {
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
    }

    if (lineTools.includes(element.tool)) {
      const outlinePoints = getStroke(points, element.freehandOptions)

      ctx.beginPath();
      ctx.moveTo(outlinePoints[0], outlinePoints[1]);
      const pathData = getSvgPathFromStroke(outlinePoints)
      const myPath = new Path2D(pathData)

      ctx.fill(myPath);
    } else {
      ctx.lineWidth = element.size;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      let i = 1;
      for (i = 1; i < points.length - 2; i += 1) {
        var xc = (points[i].x + points[i + 1].x) / 2;
        var yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      // curve through the last two points
      ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);

      if (element.tool === Tool.BLOB) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}

function handleTouchStart(event) {
  isDrawing = true;
  checkIsStylus(event);

  if (!isDrawingAllowed() || canvas.value === null) {
    console.log('her?')
    return;
  }

  const pos = getMousePos(canvas.value, event);
  const pressure = getPressure(event);
  const opacity = getOpacity();
  const composition = getComposition();

  const newElement = {
    tool: selectedTool.value,
    color: selectedColor.value,
    size: penSize.value,
    composition,
    opacity,
    points: [{ x: pos.x, y: pos.y, pressure }],
    freehandOptions: {
      size: penSize.value,
      simulatePressure: selectedTool.value === Tool.PEN && !isStylus.value,
      thinning: selectedTool.value === Tool.PEN ? 1 : 0,
      streamline: 0.32,
      smoothing: 0.32,
      last: false,
    },
  }
  canvasElements.push(newElement);
  drawElements(canvas.value, canvasElements);
}

function handleTouchMove(event) {
  if (!isDrawingAllowed() || canvas.value === null) {
    return;
  }

  event.preventDefault();

  const pos = getMousePos(canvas.value, event);
  const pressure = getPressure(event);
  const lastElement = canvasElements[canvasElements.length - 1];
  lastElement.points.push({ x: pos.x, y: pos.y, pressure });
  drawElements(canvas.value, canvasElements);
}

function handleTouchEnd(event) {
  if (!isDrawingAllowed() || canvas.value === null) {
    return;
  }

  isDrawing = false;
  const lastElement = canvasElements[canvasElements.length - 1];
  lastElement.freehandOptions.last = true;
  drawElements(canvas.value, canvasElements);
}

</script>

<template>
  <div class="canvas-wrapper">
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
    <canvas ref="canvas" :width="canvasConfig.width" :height="canvasConfig.height" @mousedown="handleTouchStart"
      @touchstart="handleTouchStart" @mouseup="handleTouchEnd" @touchend="handleTouchEnd" @mousemove="handleTouchMove"
      @touchmove="handleTouchMove">
    </canvas>
  </div>
</template>

<style scoped>
.canvas-wrapper {
  border: 2px solid red;
}

.tools {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}
</style>
