<script setup lang="ts">
import { getStroke } from 'perfect-freehand'
import polygonClipping from 'polygon-clipping'
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
  RECTANGLE = 31,
  TRIANGLE = 32,
}
const supportedTools = {
  [Tool.PEN]: { label: 'Pen' },
  [Tool.MARKER]: { label: 'Marker' },
  [Tool.HIGHLIGHTER]: { label: 'Highlighter' },
  [Tool.BLOB]: { label: 'Blob' },
  [Tool.CIRCLE]: { label: 'Circle' },
  [Tool.RECTANGLE]: { label: 'Rectangle' },
  [Tool.TRIANGLE]: { label: 'Triangle' },
  [Tool.ERASER]: { label: 'Eraser' },
}
const toolOrder = Object.keys(supportedTools).map((key) => Number(key));
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
  'transparent',
];
const selectedStrokeColor = ref(colors[0]);
const selectedFillColor = ref(colors[0]);

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
    return 'hard-light';
  }

  if (selectedTool.value === Tool.HIGHLIGHTER) {
    return 'hue';
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

function getFlatSvgPathFromStroke(stroke) {
  const faces = polygonClipping.union([stroke])

  const d = []

  faces.forEach((face) =>
    face.forEach((points) => {
      d.push(getSvgPathFromStroke(points))
    })
  )

  return d.join(' ')
}

function cacheElement(element) {
  const points = element.points.slice();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const dpi = window.devicePixelRatio;

  const minX = Math.min(...points.map(({ x }: { x: number }) => x)) - element.size;
  const minY = Math.min(...points.map(({ y }: { y: number }) => y)) - element.size;
  const maxX = Math.max(...points.map(({ x }: { x: number }) => x)) + element.size;
  const maxY = Math.max(...points.map(({ y }: { y: number }) => y)) + element.size;
  const width = (maxX - minX);
  const height = (maxY - minY);

  canvas.width = width * dpi;
  canvas.height = height * dpi;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.save();
  ctx.scale(dpi, dpi);
  ctx.translate(-minX, -minY);
  drawElement(canvas, element, true);
  ctx.restore();

  element.isCached = true;
  element.cache = {
    x: minX,
    y: minY,
    width,
    height,
    dpi,
    canvas,
  };
}

function drawElement(canvas, element, isCaching = false) {
  const ctx = canvas.getContext('2d');

  if (element.isCached) {
    const cachedCanvas = element.cache.canvas;
    const ratio = element.cache.dpi;
    ctx.save();
    ctx.globalCompositeOperation = element.composition;
    ctx.globalAlpha = element.opacity;
    ctx.translate(element.cache.x, element.cache.y);
    ctx.drawImage(
      cachedCanvas,
      0,
      0,
      cachedCanvas.width / ratio,
      cachedCanvas.height / ratio
    );
    ctx.restore();
    return;
  }

  const points = element.points.slice();
  const minX = Math.min(...points.map(({ x }: { x: number }) => x));
  const minY = Math.min(...points.map(({ y }: { y: number }) => y));
  const maxX = Math.max(...points.map(({ x }: { x: number }) => x));
  const maxY = Math.max(...points.map(({ y }: { y: number }) => y));

  ctx.save();

  if (!isCaching) {
    ctx.globalCompositeOperation = element.composition;
    ctx.globalAlpha = element.opacity;
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = element.size;

  if (Array.isArray(element.strokeColor)) {
    let gradientStartX, gradientStartY, gradientEndX, gradientEndY;
    if (Math.abs(minX - points[0].x) <= Math.abs(maxX - points[0].x)) {
      gradientStartX = minX;
      gradientEndX = maxX;
    } else {
      gradientStartX = maxX;
      gradientEndX = minX;
    }
    if (Math.abs(minY - points[0].y) <= Math.abs(maxY - points[0].y)) {
      gradientStartY = minY;
      gradientEndY = maxY;
    } else {
      gradientStartY = maxY;
      gradientEndY = minY;
    }

    const gradient = ctx.createLinearGradient(gradientStartX, gradientStartY, gradientEndX, gradientEndY);
    for (let j = 0; j < element.strokeColor.length; j += 2) {
      gradient.addColorStop(element.strokeColor[j], element.strokeColor[j + 1]);
    }
    ctx.strokeStyle = gradient;
  } else {
    ctx.strokeStyle = element.strokeColor;
  }

  if (Array.isArray(element.fillColor)) {
    let gradientStartX, gradientStartY, gradientEndX, gradientEndY;
    if (Math.abs(minX - points[0].x) <= Math.abs(maxX - points[0].x)) {
      gradientStartX = minX;
      gradientEndX = maxX;
    } else {
      gradientStartX = maxX;
      gradientEndX = minX;
    }
    if (Math.abs(minY - points[0].y) <= Math.abs(maxY - points[0].y)) {
      gradientStartY = minY;
      gradientEndY = maxY;
    } else {
      gradientStartY = maxY;
      gradientEndY = minY;
    }

    const gradient = ctx.createLinearGradient(gradientStartX, gradientStartY, gradientEndX, gradientEndY);
    for (let j = 0; j < element.fillColor.length; j += 2) {
      gradient.addColorStop(element.fillColor[j], element.fillColor[j + 1]);
    }
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = element.fillColor;
  }

  if (lineTools.includes(element.tool)) {
    const outlinePoints = getStroke(points, element.freehandOptions)

    ctx.beginPath();
    ctx.moveTo(outlinePoints[0], outlinePoints[1]);
    const pathData = getFlatSvgPathFromStroke(outlinePoints)
    const myPath = new Path2D(pathData)

    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill(myPath);
  } else if (element.tool === Tool.CIRCLE) {
    ctx.beginPath();
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const radX = Math.abs(midX - minX);
    const radY = Math.abs(midY - minY);

    ctx.ellipse(midX, midY, radX, radY, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
  } else if (element.tool === Tool.TRIANGLE) {
    ctx.beginPath();

    const dx = points[0].x - points[1].x;
    const dy = points[0].y - points[1].y;

    ctx.moveTo(points[0].x, points[0].y);

    let t1 = {
      x: points[1].x + (dy / 2),
      y: points[1].y - (dx / 2),
    };

    let t2 = {
      x: points[1].x - (dy / 2),
      y: points[1].y + (dx / 2),
    };
    ctx.lineTo(t1.x, t1.y);
    ctx.lineTo(t2.x, t2.y);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  } else if (element.tool === Tool.RECTANGLE) {
    ctx.beginPath();
    const rectangle = new Path2D();
    const width = maxX - minX;
    const height = maxY - minY;
    rectangle.rect(minX, minY, width, height);
    ctx.stroke(rectangle);
    ctx.fill(rectangle);
  } else {
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

function drawElements(canvas, elements) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < elements.length; i += 1) {
    const element = elements[i];
    drawElement(canvas, element);
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
    strokeColor: selectedStrokeColor.value,
    fillColor: selectedFillColor.value,
    size: penSize.value,
    composition,
    opacity,
    points: [{ x: pos.x, y: pos.y, pressure }],
    freehandOptions: {
      size: penSize.value,
      simulatePressure: selectedTool.value === Tool.PEN && !isStylus.value,
      thinning: selectedTool.value === Tool.PEN ? 0.95 : 0,
      streamline: 0.32,
      smoothing: 0.32,
      last: false,
    },
  }

  if (newElement.tool === Tool.CIRCLE || newElement.tool === Tool.RECTANGLE || newElement.tool === Tool.TRIANGLE) {
    newElement.points.push({ x: pos.x + 1, y: pos.y + 1, pressure });
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

  if (lastElement.tool === Tool.CIRCLE || lastElement.tool === Tool.RECTANGLE || lastElement.tool === Tool.TRIANGLE) {
    lastElement.points[1] = { x: pos.x, y: pos.y, pressure };
  } else {
    lastElement.points.push({ x: pos.x, y: pos.y, pressure });
  }
  drawElements(canvas.value, canvasElements);
}

function handleTouchEnd(event) {
  if (!isDrawingAllowed() || canvas.value === null) {
    return;
  }

  isDrawing = false;
  const lastElement = canvasElements[canvasElements.length - 1];
  lastElement.freehandOptions.last = true;

  if (lastElement.tool !== Tool.TRIANGLE) {
    cacheElement(lastElement);
  }
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
      <select v-model="selectedStrokeColor">
        <option v-for="(color, index) in colors" :key="index" :value="color">
          {{ color }}
        </option>
      </select>
      <select v-model="selectedFillColor">
        <option v-for="(color, index) in colors" :key="index" :value="color">
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
