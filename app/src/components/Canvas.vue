<script setup lang="ts">
import { getStroke } from 'perfect-freehand'
import Moveable from "vue3-moveable";
import polygonClipping from 'polygon-clipping'
import { type Ref, ref, computed, watchEffect, onMounted } from 'vue'

const canvas = ref<HTMLCanvasElement>()
const canvasConfig = ref({
  width: window.innerWidth,
  height: window.innerHeight,
})


const moveable = ref()
const windowDiag = Math.sqrt((canvasConfig.value.width * canvasConfig.value.width) + (canvasConfig.value.height * canvasConfig.value.height));
const ruler = ref({
  isVisible: false,
  width: windowDiag,
  rotation: 0,
})

let canvasElements: any[] = [];


let isMovingRuler = false;
let isDrawing = ref(false)
let isStylus = ref(false);
let detectedStlyus = ref(false);
const allowFingerDrawing = ref(true);

const showRulerControls = computed(() => {
  return !isDrawing.value
})

onMounted(() => {
  const dpi = window.devicePixelRatio;
  const ctx = canvas.value.getContext('2d')

  canvas.value.width = canvasConfig.value.width * dpi;
  canvas.value.height = canvasConfig.value.height * dpi;

  canvas.value.style.width = `${canvasConfig.value.width}px`;
  canvas.value.style.height = `${canvasConfig.value.height}px`;

  ctx.scale(dpi, dpi);
})

enum Tool {
  POINTER = 0,
  ERASER = 1,
  CLEAR_ALL = 2,
  PEN = 10,
  MARKER = 11,
  HIGHLIGHTER = 12,
  BLOB = 20,
  CIRCLE = 30,
  RECTANGLE = 31,
  TRIANGLE = 32,
  ARROW = 33,
}
const supportedTools = ref([
  { key: Tool.POINTER, label: 'Pointer' },
  { key: Tool.PEN, label: 'Pen' },
  { key: Tool.MARKER, label: 'Marker' },
  { key: Tool.HIGHLIGHTER, label: 'Highlighter' },
  { key: Tool.BLOB, label: 'Blob' },
  { key: Tool.CIRCLE, label: 'Circle' },
  { key: Tool.RECTANGLE, label: 'Rectangle' },
  { key: Tool.TRIANGLE, label: 'Triangle' },
  { key: Tool.ARROW, label: 'Arrow' },
  { key: Tool.ERASER, label: 'Eraser' },
  { key: Tool.CLEAR_ALL, label: 'Clear All' },
])
const selectedTool = ref(Tool.PEN);
const lineTools = [Tool.PEN, Tool.MARKER, Tool.HIGHLIGHTER];

const penSizes = [5, 10, 20, 40, 60];
const penSize = ref(40); // 20, 40, 60, 80

const colors = [
  { r: 0, g: 0, b: 0, a: 1 },
  { r: 255, g: 0, b: 0, a: 1 },
  { r: 0, g: 255, b: 0, a: 1 },
  { r: 0, g: 0, b: 255, a: 1 },
  { r: 255, g: 255, b: 0, a: 1 },
  { r: 255, g: 0, b: 255, a: 1 },
  { r: 0, g: 255, b: 255, a: 1 },
  { r: 255, g: 255, b: 255, a: 1 },
  [0, '#ff0000', 1, '#0000ff'],
  [0, '#00ff00', 1, '#ff0000'],
  [0, '#0000ff', 1, '#00ff00'],
  'transparent',
];
const selectedFillColor = ref(colors[0]);
const selectedStrokeColor = ref(colors[colors.length - 1]);

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


function handleToolChange(event) {
  if (selectedTool.value === Tool.CLEAR_ALL) {
    canvasElements = [];
    drawElements(canvas.value, canvasElements);
    selectedTool.value = Tool.ERASER;
    event.target.blur();
  }
}

function checkIsStylus(event) {
  let force = event.touches ? event.touches[0]["force"] : 0;
  isStylus.value = force > 0;
  detectedStlyus.value = detectedStlyus.value || isStylus.value;
}

function isDrawingAllowed() {
  if (!isDrawing.value || isMovingRuler || selectedTool.value === Tool.POINTER || (detectedStlyus.value && !isStylus.value && !allowFingerDrawing.value)) {
    return false
  }

  return true;
}

function getPressure(event): number {
  if (selectedTool.value === Tool.PEN) {
    return isStylus.value ? event.touches[0]["force"] : 1;
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

function formatColor(color, opacity) {
  if (color === 'transparent') {
    return 'transparent';
  }

  return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
}

function getMousePos(canvas, event) {
  const rect = canvas.getBoundingClientRect(); // abs. size of element
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  let inputX = clientX;
  let inputY = clientY;
  let isRulerLine = false;

  if (ruler.value.isVisible && moveable.value) {
    const searchDistance = penSize.value * 2;
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
          const searchDirction = searchDirections[i];
          const isInside = moveable.value.isInside(searchDirction[0], searchDirction[1]);

          if (isFirstLoop) {
            searchFor = !isInside;
            isFirstLoop = false;
          }

          if (isInside === searchFor) {
            foundX = searchDirction[0];
            foundY = searchDirction[1];
            break;
          }
        }

        if (typeof foundX !== 'undefined' && typeof foundY !== 'undefined') {
          break;
        }

        dy += 1;
      }

      if (typeof foundX !== 'undefined' && typeof foundY !== 'undefined') {
        break;
      }

      dx += 1;
    }

    if (typeof foundX !== 'undefined' && typeof foundY !== 'undefined') {
      isRulerLine = true;
      inputX = foundX;
      inputY = foundY;
    }
  }

  const x = (inputX - rect.left);
  const y = (inputY - rect.top);
  return { x, y, isRulerLine }
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

  element.isDrawingCached = true;
  element.cache.drawing = {
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

  if (element.isDrawingCached) {
    const cachedCanvas = element.cache.drawing.canvas;
    const ratio = element.cache.drawing.dpi;
    ctx.save();
    ctx.globalCompositeOperation = element.composition;
    ctx.translate(element.cache.drawing.x, element.cache.drawing.y);
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

  if (typeof element.cache === 'undefined') {
    element.cache = {};
  }

  const points = element.points.slice();
  const minX = Math.min(...points.map(({ x }: { x: number }) => x));
  const minY = Math.min(...points.map(({ y }: { y: number }) => y));
  const maxX = Math.max(...points.map(({ x }: { x: number }) => x));
  const maxY = Math.max(...points.map(({ y }: { y: number }) => y));

  ctx.save();

  if (isCaching && element.tool === Tool.ERASER) {
    ctx.globalCompositeOperation = 'source-over';
  } else {
    ctx.globalCompositeOperation = element.composition;
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
    ctx.strokeStyle = formatColor(element.strokeColor, element.opacity);
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
    ctx.fillStyle = formatColor(element.fillColor, element.opacity);
  }

  if (lineTools.includes(element.tool)) {
    ctx.save()
    ctx.beginPath();
    const outlineStrokePoints = getStroke(points, {
      ...element.freehandOptions,
      size: element.freehandOptions.size * 1.5,
      thinning: element.freehandOptions.thinning / 1.5,
    })
    ctx.moveTo(outlineStrokePoints[0][0], outlineStrokePoints[0][1]);
    const strokeData = getFlatSvgPathFromStroke(outlineStrokePoints)
    const myStroke = new Path2D(strokeData)
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill(myStroke);
    ctx.restore()

    ctx.save()
    if (element.fillColor === 'transparent') {
      ctx.globalCompositeOperation = 'xor';
      ctx.fillStyle = "#ff0000";
    }
    ctx.beginPath();
    const outlinePoints = getStroke(points, element.freehandOptions)
    ctx.moveTo(outlinePoints[0][0], outlinePoints[0][1]);
    const pathData = getFlatSvgPathFromStroke(outlinePoints)
    const myPath = new Path2D(pathData)
    ctx.fill(myPath);
    ctx.restore()
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
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
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
  } else if (element.tool === Tool.ARROW) {
    const fromx = points[0].x;
    const fromy = points[0].y;
    const tox = points[3].x;
    const toy = points[3].y;

    ctx.save()
    ctx.lineWidth *= 1.5;
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.moveTo(tox, toy);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.stroke();
    ctx.restore()

    ctx.save();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.moveTo(tox, toy);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.stroke();
    ctx.restore();
  } else if (element.tool === Tool.BLOB || element.tool === Tool.ERASER) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    let i = 0;
    for (i = 0; i < points.length - 2; i += 1) {
      var xc = (points[i].x + points[i + 1].x) / 2;
      var yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);

    if (element.tool === Tool.BLOB) {
      ctx.closePath();
      ctx.save()
      if (element.strokeColor === 'transparent') {
        ctx.strokeStyle = ctx.fillStyle;
      }
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (element.tool === Tool.ERASER) {
      ctx.save()
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.restore();
    }
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

function handleCanvasTouchStart(event) {
  isDrawing.value = true;
  checkIsStylus(event);

  if (!isDrawingAllowed() || canvas.value === null) {
    return;
  }

  const pos = getMousePos(canvas.value, event);
  const isRulerLine = pos.isRulerLine;
  const pressure = getPressure(event);
  const opacity = getOpacity();
  const composition = getComposition();

  const newElement = {
    tool: selectedTool.value,
    fillColor: selectedFillColor.value,
    strokeColor: selectedStrokeColor.value,
    size: penSize.value,
    composition,
    opacity,
    isRulerLine,
    points: [{ x: pos.x, y: pos.y, pressure }],
    freehandOptions: {
      size: penSize.value,
      simulatePressure: selectedTool.value === Tool.PEN && !isStylus.value,
      thinning: selectedTool.value === Tool.PEN ? 0.95 : 0,
      streamline: isRulerLine ? 1 : 0.32,
      smoothing: isRulerLine ? 1 : 0.32,
      last: false,
    },
  }

  if (newElement.tool === Tool.CIRCLE || newElement.tool === Tool.RECTANGLE || newElement.tool === Tool.BLOB || newElement.tool === Tool.ERASER) {
    newElement.points.push({ x: pos.x, y: pos.y, pressure });
  } else if (newElement.tool === Tool.TRIANGLE) {
    newElement.points.push({ x: pos.x, y: pos.y, pressure });
    newElement.points.push({ x: pos.x, y: pos.y, pressure });
  } else if (newElement.tool === Tool.ARROW) {
    const fromx = pos.x;
    const fromy = pos.y;
    const tox = pos.x;
    const toy = pos.y;
    var headlen = newElement.size * 2; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);

    let a1 = {
      x: tox - headlen * Math.cos(angle - Math.PI / 5),
      y: toy - headlen * Math.sin(angle - Math.PI / 5),
      pressure,
    };
    let a2 = {
      x: tox - headlen * Math.cos(angle + Math.PI / 5),
      y: toy - headlen * Math.sin(angle + Math.PI / 5),
      pressure,
    };

    newElement.points[1] = a1;
    newElement.points[2] = a2;
    newElement.points[3] = { x: pos.x, y: pos.y, pressure };
  }

  canvasElements.push(newElement);
  drawElements(canvas.value, canvasElements);
}

function handleCanvasTouchMove(event) {
  if (!isDrawingAllowed() || canvas.value === null) {
    return;
  }

  event.preventDefault();

  const pos = getMousePos(canvas.value, event);
  const pressure = getPressure(event);
  const lastElement = canvasElements[canvasElements.length - 1];

  lastElement.isRulerLine = lastElement.isRulerLine || pos.isRulerLine;
  if (lastElement.isRulerLine) {
    lastElement.freehandOptions.streamline = 1;
    lastElement.freehandOptions.smoothing = 1;
  }

  if (lastElement.tool === Tool.CIRCLE || lastElement.tool === Tool.RECTANGLE) {
    lastElement.points[1] = { x: pos.x, y: pos.y, pressure };
  } else if (lastElement.tool === Tool.TRIANGLE) {
    const dx = lastElement.points[0].x - pos.x;
    const dy = lastElement.points[0].y - pos.y;

    let p2 = {
      x: pos.x + (dy / 2),
      y: pos.y - (dx / 2),
    };

    let p3 = {
      x: pos.x - (dy / 2),
      y: pos.y + (dx / 2),
    };

    lastElement.points[1] = p2;
    lastElement.points[2] = p3;
  } else if (lastElement.tool === Tool.ARROW) {
    const fromx = lastElement.points[0].x;
    const fromy = lastElement.points[0].y;
    const tox = pos.x;
    const toy = pos.y;
    var headlen = lastElement.size * 2; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);

    let a1 = {
      x: tox - headlen * Math.cos(angle - Math.PI / 5),
      y: toy - headlen * Math.sin(angle - Math.PI / 5),
    };
    let a2 = {
      x: tox - headlen * Math.cos(angle + Math.PI / 5),
      y: toy - headlen * Math.sin(angle + Math.PI / 5),
    };

    lastElement.points[1] = a1;
    lastElement.points[2] = a2;
    lastElement.points[3] = { x: pos.x, y: pos.y };
  } else {
    lastElement.points.push({ x: pos.x, y: pos.y, pressure });
  }

  drawElements(canvas.value, canvasElements);
}

function handleCanvasTouchEnd(event) {
  if (!isDrawingAllowed() || canvas.value === null) {
    return;
  }

  const lastElement = canvasElements[canvasElements.length - 1];
  lastElement.freehandOptions.last = true;

  cacheElement(lastElement);
  drawElements(canvas.value, canvasElements);
  isDrawing.value = false;
}

function onRulerMoveStart() {
  isMovingRuler = true;
}

function onRulerMoveEnd() {
  isMovingRuler = false;
}

function onRulerDrag({ target, transform, isPinch }) {
  if (isPinch) {
    return;
  }

  target.style.transform = transform;
}

function onRulerRotate({ target, drag, rotation }) {
  const translate = drag.translate;
  const normalizedRotation = rotation % 360;
  const absRotation = Math.abs(normalizedRotation);
  let transformRotation = normalizedRotation;

  const direction = normalizedRotation > 0 ? 1 : -1;
  const snapTargets = [0, 45, 90, 135, 180, 225, 270, 315, 360];
  const snapThreshold = 5;

  for (let i = 0; i < snapTargets.length; i += 1) {
    const target = snapTargets[i];

    if (absRotation < target && absRotation + snapThreshold >= target) {
      transformRotation = target * direction;
      break;
    } else if (absRotation > target && absRotation - snapThreshold <= target) {
      transformRotation = target * direction;
      break;
    }
  }

  let transform = `translate(${translate[0]}px, ${translate[1]}px) rotate(${transformRotation}deg)`;
  ruler.value.rotation = transformRotation % 360;
  target.style.transform = transform;
}

</script>

<template>
  <div class="canvas-wrapper">
    <div class="tools">
      <select v-model.number="selectedTool" @change="handleToolChange">
        <option v-for="tool in supportedTools" :key="tool.key" :value="tool.key">
          {{ tool.label }}
        </option>
      </select>
      <select v-model="penSize">
        <option v-for="size in penSizes" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
      <select v-model="selectedFillColor">
        <option v-for="(color, index) in colors" :key="index" :value="color">
          {{ color }}
        </option>
      </select>
      <select v-model="selectedStrokeColor">
        <option v-for="(color, index) in colors" :key="index" :value="color">
          {{ color }}
        </option>
      </select>
      <select v-model="selectedComposition">
        <option v-for="composition in compositionOptions" :key="composition" :value="composition">
          {{ composition }}
        </option>
      </select>
      <label><input type="checkbox" v-model="ruler.isVisible" /> Show Ruler?</label>
      <label><input type="checkbox" v-model="detectedStlyus" :disabled="true" /> Detected Stylus?</label>
      <label><input type="checkbox" v-model="isStylus" :disabled="true" /> isStylus?</label>
      <label><input type="checkbox" v-model="allowFingerDrawing" /> finger?</label>
    </div>
    <div>
      <div v-show="ruler.isVisible" :class="{ 'hide-ruler-controls': !showRulerControls }">
        <div class="ruler-container" :style="{ width: ruler.width + 'px' }">
          <div class="ruler-rotation">{{ Math.round(ruler.rotation) }}&deg;</div>
          <div class="ruler" :style="{ width: ruler.width + 'px' }"></div>
        </div>
        <Moveable ref="moveable" v-if="ruler.isVisible" className=" moveable" :target="['.ruler-container']"
          :pinchable="['rotatable']" :draggable="!isDrawing" :rotatable="!isDrawing" :scalable="false"
          :throttleRotate="1" @drag="onRulerDrag" @rotate="onRulerRotate" @renderStart="onRulerMoveStart"
          @renderEnd="onRulerMoveEnd" />
      </div>
      <canvas ref="canvas" :width="canvasConfig.width" :height="canvasConfig.height" @mousedown="handleCanvasTouchStart"
        @touchstart="handleCanvasTouchStart" @mouseup="handleCanvasTouchEnd" @touchend="handleCanvasTouchEnd"
        @mousemove="handleCanvasTouchMove" @touchmove="handleCanvasTouchMove">
      </canvas>
    </div>
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

.ruler-container {
  position: fixed;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  top: 50%;
  left: -5%;
  transform-origin: center center;
  transform: translate(0, 0) rotate(0deg);
  z-index: 1;
}

.ruler-rotation {
  position: absolute;
  z-index: 1;
}

.ruler {
  height: 100px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.5);
  background: linear-gradient(to right, rgba(255, 0, 0, 0.5) 0%, rgba(0, 0, 255, 0.5) 100%);
}
</style>

<style>
.hide-ruler-controls .moveable-control-box .moveable-rotation {
  display: none;
}

.moveable-control-box .moveable-control.moveable-rotation-control {
  width: 30px;
  height: 30px;
  margin-top: -15px;
  margin-left: -15px;
}

.moveable-control-box .moveable-control.moveable-origin {
  display: none;
}
</style>
