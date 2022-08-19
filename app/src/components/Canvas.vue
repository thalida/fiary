<script setup lang="ts">
import { getStroke } from 'perfect-freehand'
import ColorPicker from '@mcistudio/vue-colorpicker'
import '@mcistudio/vue-colorpicker/dist/style.css'
import Moveable from "vue3-moveable";
import polygonClipping from 'polygon-clipping'
import { type Ref, ref, computed, watchEffect, watchPostEffect, onMounted, watch, nextTick } from 'vue'

const debugMode = ref(false);
const isPasteMode = ref(false);
const canvas = ref<HTMLCanvasElement>()
const pasteCanvas = ref<HTMLCanvasElement>();
const canvasConfig = ref({
  width: window.innerWidth,
  height: window.innerHeight,
})

const moveableRuler = ref()
const moveablePaste = ref()
const rulerElement = ref()
const windowDiag = Math.sqrt((canvasConfig.value.width * canvasConfig.value.width) + (canvasConfig.value.height * canvasConfig.value.height));
const ruler = ref({
  isVisible: false,
  width: windowDiag,
  transform: {
    translate: [0, 0],
    scale: [1, 1],
    rotate: 35,
  },
})
const pasteTransform = ref({
  translate: [0, 0],
  scale: [1, 1],
  rotate: 0,
});

let canvasElements = ref([] as any[]);
let cutShape = ref();

let isMovingRuler = false;
let isDrawing = ref(false)
let isStylus = ref(false);
let detectedStlyus = ref(false);
const allowFingerDrawing = ref(true);

const showRulerControls = computed(() => {
  return !isDrawing.value
})

onMounted(() => {
  if (typeof canvas.value === 'undefined') {
    return;
  }

  const ctx = canvas.value.getContext('2d')

  if (ctx === null) {
    return;
  }

  const dpi = window.devicePixelRatio;
  canvas.value.width = canvasConfig.value.width * dpi;
  canvas.value.height = canvasConfig.value.height * dpi;

  canvas.value.style.width = `${canvasConfig.value.width}px`;
  canvas.value.style.height = `${canvasConfig.value.height}px`;

  ctx.scale(dpi, dpi);
})

watch(
  () => debugMode.value,
  () => {
    drawElements(canvas.value, canvasElements.value)
  }
)

watchPostEffect(() => {
  if (ruler.value.isVisible) {
    setRulerTransform(rulerElement.value, {})
  }
})

// watch(
//   () => ruler.value.isVisible,
//   () => {
//   },
//   { flush: 'post' }
// )

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
  CUT = 40,
  PASTE = 41,
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
  { key: Tool.CUT, label: 'Cut' },
  { key: Tool.ERASER, label: 'Eraser' },
  { key: Tool.CLEAR_ALL, label: 'Clear All' },
])
const selectedTool = ref(Tool.PEN);
const lineTools = [Tool.PEN, Tool.MARKER, Tool.HIGHLIGHTER];

const penSizes = [5, 10, 20, 40, 60];
const penSize = ref(40); // 20, 40, 60, 80

const TRANSPARENT_COLOR = 'transparent';
const swatches = ref([
  {
    key: 'lightmode',
    label: 'Lightmode',
    colors: [
      { r: 0, g: 0, b: 0, a: 1 },
      { r: 255, g: 0, b: 0, a: 1 },
      { r: 0, g: 255, b: 0, a: 1 },
      { r: 0, g: 0, b: 255, a: 1 },
      { r: 255, g: 255, b: 0, a: 1 },
      { r: 0, g: 255, b: 255, a: 1 },
      { r: 255, g: 0, b: 255, a: 1 },
      [
        {
          percent: 0,
          color: { r: 255, g: 0, b: 0, a: 1 },
        },
        {
          percent: 100,
          color: { r: 0, g: 0, b: 255, a: 1 },
        },
      ],
      [
        {
          percent: 0,
          color: { r: 0, g: 255, b: 0, a: 1 },
        },
        {
          percent: 100,
          color: { r: 0, g: 0, b: 255, a: 1 },
        },
      ]
    ],
  }
]);

const selectedSwatch = ref(swatches.value[0]);
const selectedFillColor = ref(selectedSwatch.value.colors[0]);
const selectedStrokeColor = ref(TRANSPARENT_COLOR);

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
    canvasElements.value = [];
    drawElements(canvas.value, canvasElements.value);
    selectedTool.value = Tool.ERASER;
    event.target.blur();
  }
}

function checkIsStylus(event) {
  let force = event.touches ? event.touches[0]["force"] : 0;
  isStylus.value = force > 0;
  detectedStlyus.value = detectedStlyus.value || isStylus.value;
}

function isDrawingAllowed(isDrawingOverride = false) {
  const activeDrawing = isDrawing.value || isDrawingOverride
  if (!activeDrawing || isMovingRuler || isPasteMode.value || selectedTool.value === Tool.POINTER || (detectedStlyus.value && !isStylus.value && !allowFingerDrawing.value)) {
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

function getSmoothPoints(element) {
  const stroke = getStroke(element.points, {
    ...element.freehandOptions,
    size: element.freehandOptions.size * 1.5,
    thinning: element.freehandOptions.thinning / 1.5,
  })
  const path = getStroke(element.points, element.freehandOptions)

  return {
    stroke,
    path,
  }
}

function calculateDimensions(element) {
  let xPoints, yPoints;
  if (lineTools.includes(element.tool)) {
    xPoints = element.smoothPoints.path.map((point) => point[0]);
    yPoints = element.smoothPoints.path.map((point) => point[1]);
  } else {
    xPoints = element.points.map(({ x }: { x: number }) => x);
    yPoints = element.points.map(({ y }: { y: number }) => y);
  }

  const minX = Math.min(...xPoints);
  const minY = Math.min(...yPoints);
  const maxX = Math.max(...xPoints);
  const maxY = Math.max(...yPoints);
  const width = (maxX - minX);
  const height = (maxY - minY);

  let outerMinX = minX;
  let outerMinY = minY;
  let outerMaxX = maxX;
  let outerMaxY = maxY;


  if (lineTools.includes(element.tool) && element.strokeColor !== 'transparent') {
    let outerXPoints = element.smoothPoints.stroke.map((point) => point[0]);
    let outerYPoints = element.smoothPoints.stroke.map((point) => point[1]);
    outerMinX = Math.min(...outerXPoints);
    outerMinY = Math.min(...outerYPoints);
    outerMaxX = Math.max(...outerXPoints);
    outerMaxY = Math.max(...outerYPoints);
  } else {
    let strokeSize = 0;

    if (element.tool === Tool.ARROW) {
      strokeSize = element.strokeColor !== 'transparent' ? element.size * 0.75 : element.size / 2
    } else if (element.strokeColor !== 'transparent' || element.tool === Tool.BLOB || element.tool === Tool.ERASER) {
      strokeSize = element.size / 2;
    }

    outerMinX -= strokeSize;
    outerMinY -= strokeSize;
    outerMaxX += strokeSize;
    outerMaxY += strokeSize;
  }

  const outerWidth = (outerMaxX - outerMinX);
  const outerHeight = (outerMaxY - outerMinY);
  const dimensions = {
    minX,
    minY,
    maxX,
    maxY,
    outerMinX,
    outerMinY,
    outerMaxX,
    outerMaxY,
    width,
    height,
    outerWidth,
    outerHeight,
    lineLength: null,
  };

  if (lineTools.includes(element.tool)) {
    dimensions.lineLength = Math.sqrt(Math.pow(dimensions.width, 2) + Math.pow(dimensions.height, 2));
  }


  return dimensions
}

function getMousePos(canvas, event, followRuler = false) {
  const rect = canvas.getBoundingClientRect(); // abs. size of element
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  let inputX = clientX;
  let inputY = clientY;
  let isRulerLine = false;

  if (followRuler && ruler.value.isVisible && moveableRuler.value) {
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
          const searchDirction = searchDirections[i];
          const isInside = moveableRuler.value.isInside(searchDirction[0], searchDirction[1]);

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
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const dpi = window.devicePixelRatio;

  const minX = element.dimensions.outerMinX;
  const minY = element.dimensions.outerMinY;
  const width = element.dimensions.outerWidth;
  const height = element.dimensions.outerHeight;

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

function drawElement(canvas, element, isCaching = false, bypassCache = false) {
  const ctx = canvas.getContext('2d');

  if (element.dimensions.outerWidth === 0 || element.dimensions.outerHeight === 0) {
    return
  }

  if (element.isDrawingCached && !bypassCache) {
    const cachedCanvas = element.cache.drawing.canvas;
    const dpi = element.cache.drawing.dpi;
    ctx.save();
    ctx.globalCompositeOperation = element.composition;
    ctx.translate(element.cache.drawing.x, element.cache.drawing.y);
    ctx.drawImage(
      cachedCanvas,
      0,
      0,
      cachedCanvas.width / dpi,
      cachedCanvas.height / dpi
    );
    ctx.restore();

    if (debugMode.value) {
      ctx.save();
      ctx.beginPath();
      ctx.translate(element.cache.drawing.x, element.cache.drawing.y);
      ctx.rect(0, 0, cachedCanvas.width / dpi, cachedCanvas.height / dpi);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();
    }
    return;
  }

  const points = element.points.slice();
  const { minX, minY, maxX, maxY } = element.dimensions;

  ctx.save();

  if (isCaching && (element.tool === Tool.ERASER || element.tool === Tool.CUT)) {
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
    for (let j = 0; j < element.strokeColor.length; j += 1) {
      const colorStop = element.strokeColor[j];
      const stop = colorStop.percent / 100;
      const color = formatColor(colorStop.color, element.opacity);
      gradient.addColorStop(stop, color);
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
    for (let j = 0; j < element.fillColor.length; j += 1) {
      const colorStop = element.fillColor[j];
      const stop = colorStop.percent / 100;
      const color = formatColor(colorStop.color, element.opacity);
      gradient.addColorStop(stop, color);
    }
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = formatColor(element.fillColor, element.opacity);
  }

  if (lineTools.includes(element.tool)) {
    ctx.save()
    ctx.beginPath();
    const strokePoints = element.smoothPoints.stroke;
    ctx.moveTo(strokePoints[0][0], strokePoints[0][1]);
    const strokeData = getFlatSvgPathFromStroke(strokePoints)
    const myStroke = new Path2D(strokeData)
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill(myStroke);
    ctx.restore()

    ctx.save()
    if (element.fillColor === 'transparent') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = "#fff";
    }
    ctx.beginPath();
    const pathPoints = element.smoothPoints.path;
    ctx.moveTo(pathPoints[0][0], pathPoints[0][1]);
    const pathData = getFlatSvgPathFromStroke(pathPoints)
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

    if (points.length >= 2) {
      ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }

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
  } else if (element.tool === Tool.CUT) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    let i = 0;
    for (i = 0; i < points.length - 2; i += 1) {
      var xc = (points[i].x + points[i + 1].x) / 2;
      var yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    if (points.length >= 2) {
      ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }

    if (element.isCompletedCut) {
      ctx.fillStyle = "#ffffff";
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#ff0000";
      ctx.stroke();
    }
  }

  ctx.restore();
}

function clearCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawElements(canvas, elements) {
  clearCanvas(canvas);

  for (let i = 0; i < elements.length; i += 1) {
    const element = elements[i];
    drawElement(canvas, element);
  }
}

async function startPasteMode(canvasElements) {
  pasteTransform.value = {
    translate: [0, 0],
    scale: [1, 1],
    rotate: 0,
  };
  isPasteMode.value = true;
  await nextTick();

  if (typeof pasteCanvas.value === 'undefined') {
    return;
  }

  const ctx = pasteCanvas.value.getContext('2d');

  if (ctx === null) {
    return;
  }

  const cutSelection = canvasElements[canvasElements.length - 1];
  pasteTransform.value.translate = [cutSelection.cache.drawing.x, cutSelection.cache.drawing.y];
  setPasteTransform(pasteCanvas.value, pasteTransform.value);

  const dpi = cutSelection.cache.drawing.dpi;
  const width = cutSelection.cache.drawing.width;
  const height = cutSelection.cache.drawing.height;

  pasteCanvas.value.width = width * dpi;
  pasteCanvas.value.height = height * dpi;

  pasteCanvas.value.style.width = `${width}px`;
  pasteCanvas.value.style.height = `${height}px`;
  ctx.scale(dpi, dpi);

  clearCanvas(pasteCanvas.value);
  ctx.translate(-cutSelection.cache.drawing.x, -cutSelection.cache.drawing.y);
  drawElement(pasteCanvas.value, cutSelection, false, true);
  ctx.clip();
  for (let i = 0; i < canvasElements.length - 1; i += 1) {
    const element = canvasElements[i];
    drawElement(pasteCanvas.value, element);
  }
}

function endPasteMode(canvasElements) {
  if (typeof pasteCanvas.value === 'undefined') {
    return;
  }

  const moveableRect = moveablePaste.value.getRect();
  const pasteElement = {
    tool: Tool.PASTE,
    composition: getComposition(),
    isDrawingCached: true,
    dimensions: {
      outerMinX: moveableRect.left,
      outerMinY: moveableRect.top,
      outerWidth: moveableRect.width,
      outerHeight: moveableRect.height,
    },
    cache: {
      drawing: {},
    },
  };

  const pasteCacheCanvas = document.createElement('canvas');
  const ctx = pasteCacheCanvas.getContext('2d');

  if (ctx === null) {
    return;
  }

  const dpi = window.devicePixelRatio;
  const minX = pasteElement.dimensions.outerMinX;
  const minY = pasteElement.dimensions.outerMinY;
  const width = pasteElement.dimensions.outerWidth;
  const height = pasteElement.dimensions.outerHeight;
  const rotRad = pasteTransform.value.rotate * Math.PI / 180;

  pasteCacheCanvas.width = width * dpi;
  pasteCacheCanvas.height = height * dpi;
  pasteCacheCanvas.style.width = `${width}px`;
  pasteCacheCanvas.style.height = `${height}px`;

  const centerX = width / 2;
  const centerY = height / 2;

  ctx.save();
  ctx.scale(dpi, dpi);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotRad);
  ctx.drawImage(
    pasteCanvas.value,
    -pasteCanvas.value.offsetWidth / 2,
    -pasteCanvas.value.offsetHeight / 2,
    pasteCanvas.value.offsetWidth,
    pasteCanvas.value.offsetHeight
  );
  ctx.restore();

  pasteElement.isDrawingCached = true;
  pasteElement.cache.drawing = {
    x: minX,
    y: minY,
    width,
    height,
    dpi,
    canvas: pasteCacheCanvas,
  };

  canvasElements.push(pasteElement);
  drawElements(canvas.value, canvasElements);
  isPasteMode.value = false;
}

function handleCanvasTouchStart(event) {
  checkIsStylus(event);

  if (!isDrawingAllowed(true) || canvas.value === null) {
    return;
  }
  isDrawing.value = true;

  const pos = getMousePos(canvas.value, event, true);
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
    smoothPoints: {},
    dimensions: {},
    cache: {},
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

  if (lineTools.includes(newElement.tool)) {
    newElement.smoothPoints = getSmoothPoints(newElement);
  }
  newElement.dimensions = calculateDimensions(newElement);

  canvasElements.value.push(newElement);
  drawElements(canvas.value, canvasElements.value);
}

function handleCanvasTouchMove(event) {
  if (!isDrawingAllowed() || canvas.value === null) {
    return;
  }

  event.preventDefault();

  const lastElement = canvasElements.value[canvasElements.value.length - 1];
  const followRuler = lastElement.isRulerLine || !lineTools.includes(lastElement.tool);
  const pos = getMousePos(canvas.value, event, followRuler);
  const pressure = getPressure(event);

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

  lastElement.isRulerLine = pos.isRulerLine;

  if (lineTools.includes(lastElement.tool)) {
    lastElement.smoothPoints = getSmoothPoints(lastElement);
  }
  lastElement.dimensions = calculateDimensions(lastElement);

  drawElements(canvas.value, canvasElements.value);
}

function handleCanvasTouchEnd(event) {
  if (isPasteMode.value) {
    endPasteMode(canvasElements.value)
    return;
  }

  if (!isDrawingAllowed() || canvas.value === null) {
    return;
  }

  const lastElement = canvasElements.value[canvasElements.value.length - 1];
  lastElement.freehandOptions.last = true;
  lastElement.dimensions = calculateDimensions(lastElement);

  if (lastElement.dimensions.outerWidth === 0 || lastElement.dimensions.outerHeight === 0) {
    canvasElements.value.pop();
    isDrawing.value = false;
    return;
  }

  if (lastElement.tool === Tool.CUT) {
    lastElement.isCompletedCut = true;
    lastElement.composition = 'destination-out';
    cacheElement(lastElement);
    drawElements(canvas.value, canvasElements.value);
    startPasteMode(canvasElements.value);
  } else {
    cacheElement(lastElement);
    drawElements(canvas.value, canvasElements.value);
  }
  isDrawing.value = false;
}


function setRulerTransform(target, transform) {
  const nextTransform = {
    ...ruler.value.transform,
    ...transform,
  }

  const translate = `translate(${nextTransform.translate[0]}px, ${nextTransform.translate[1]}px)`;
  const scale = `scale(${nextTransform.scale[0]}, ${nextTransform.scale[1]})`;
  const rotate = `rotate(${nextTransform.rotate}deg)`;
  target.style.transform = `${translate} ${scale} ${rotate}`;
  ruler.value.transform = nextTransform;
}

function onRulerMoveStart(e) {
  isMovingRuler = true;
}

function onRulerMoveEnd() {
  isMovingRuler = false;
}

function onRulerDrag({ target, translate }) {
  setRulerTransform(target, { translate });
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

  setRulerTransform(target, { rotate: transformRotation % 360, translate: drag.translate });
}

function onPasteMoveStart() {
  // isMovingRuler = true;
}

function onPasteMoveEnd(res) {
  // console.log('end', res);
  // isMovingRuler = false;
}

function setPasteTransform(target, transform) {
  const nextTransform = {
    ...pasteTransform.value,
    ...transform,
  }

  const translate = `translate(${nextTransform.translate[0]}px, ${nextTransform.translate[1]}px)`;
  const scale = `scale(${nextTransform.scale[0]}, ${nextTransform.scale[1]})`;
  const rotate = `rotate(${nextTransform.rotate}deg)`;
  target.style.transform = `${translate} ${scale} ${rotate}`;

  pasteTransform.value = nextTransform;
}

function onPasteDrag({ target, translate }) {
  setPasteTransform(target, { translate });
}

function onPasteRotate({ target, rotate, drag }) {
  setPasteTransform(target, { rotate, translate: drag.translate });
}

function onPasteScale({ target, scale, drag }) {
  setPasteTransform(target, { scale, translate: drag.translate });
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
      <!-- <ColorPicker></ColorPicker> -->
      <select v-model="selectedFillColor">
        <option v-for="(color, index) in selectedSwatch.colors" :key="index" :value="color">
          {{ color }}
        </option>
      </select>
      <select v-model="selectedStrokeColor">
        <option v-for="(color, index) in selectedSwatch.colors" :key="index" :value="color">
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
      <label><input type="checkbox" v-model="debugMode" /> debug?</label>
    </div>
    <div>
      <div class="ruler-container" v-if="ruler.isVisible" :class="{ 'hide-ruler-controls': !showRulerControls }">
        <div class="ruler" ref="rulerElement" :style="{ width: ruler.width + 'px' }">
          <div class="ruler__label">
            {{ Math.round(ruler.transform.rotate) }}&deg;
            <span v-if="canvasElements.length > 0 && isDrawing">
              <span v-if="canvasElements[canvasElements.length - 1].dimensions.lineLength">
                {{ Math.round(canvasElements[canvasElements.length - 1].dimensions.lineLength) }}px
              </span>
              <span v-else>
                {{ Math.round(canvasElements[canvasElements.length - 1].dimensions.outerWidth) }} x
                {{ Math.round(canvasElements[canvasElements.length - 1].dimensions.outerHeight) }}
              </span>
            </span>
          </div>
          <div class="ruler__tool" :style="{ width: ruler.width + 'px' }"></div>
        </div>
        <Moveable ref="moveableRuler" v-if="ruler.isVisible" className="moveable-ruler" :target="['.ruler']"
          :pinchable="['rotatable']" :draggable="!isDrawing" :rotatable="!isDrawing" :scalable="false"
          :throttleRotate="1" @drag="onRulerDrag" @rotate="onRulerRotate" @renderStart="onRulerMoveStart"
          @renderEnd="onRulerMoveEnd" />
      </div>

      <div v-if="isPasteMode">
        <canvas class="paste_canvas" ref="pasteCanvas"></canvas>
        <Moveable ref="moveablePaste" className="moveable-paste" :target="['.paste_canvas']" :pinchable="true"
          :draggable="true" :rotatable="true" :scalable="true" :keepRatio="true" @drag="onPasteDrag"
          @rotate="onPasteRotate" @scale="onPasteScale" @renderStart="onPasteMoveStart" @renderEnd="onPasteMoveEnd" />
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

.paste_canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}

.ruler-container {
  z-index: 1;
}

.ruler {
  position: fixed;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  top: 50%;
  left: -5%;
  transform-origin: center center;
  transform: translate(0, 0) rotate(0deg);
}

.ruler__label {
  position: absolute;
  z-index: 1;
}

.ruler__tool {
  height: 100px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.5);
  background: linear-gradient(to right, rgba(255, 0, 0, 0.5) 0%, rgba(0, 0, 255, 0.5) 100%);
}
</style>

<style>
.hide-ruler-controls .moveable-ruler.moveable-control-box .moveable-rotation {
  display: none;
}

.moveable-ruler.moveable-control-box .moveable-control.moveable-rotation-control {
  width: 30px;
  height: 30px;
  margin-top: -15px;
  margin-left: -15px;
}

.moveable-control-box .moveable-control.moveable-origin {
  display: none;
}
</style>
