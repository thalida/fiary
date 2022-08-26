<script setup lang="ts">
import { type Ref, ref, computed, watchEffect, watchPostEffect, onMounted, watch, nextTick } from 'vue'
import { v4 as uuidv4 } from 'uuid';
import cloneDeep from 'lodash/cloneDeep';
import { getStroke } from 'perfect-freehand'
import ColorPicker from '@mcistudio/vue-colorpicker'
import '@mcistudio/vue-colorpicker/dist/style.css'
import Moveable from "moveable";
import Selecto from "selecto";
import MoveableVue from "vue3-moveable";
import polygonClipping from 'polygon-clipping'
import Ftextarea from './Ftextarea.vue'

const debugMode = ref(false);
const isPasteMode = ref(false);
const isAddImageMode = ref(false);
const isInteractiveEditMode = ref(false);
const isTextboxEditMode = ref(false);
const activeTextbox = ref(null);

const canvasConfig = ref({
  width: window.innerWidth,
  height: window.innerHeight,
  dpi: window.devicePixelRatio,
})
const windowDiag = Math.sqrt((canvasConfig.value.width * canvasConfig.value.width) + (canvasConfig.value.height * canvasConfig.value.height));
const canvas = ref<HTMLCanvasElement>()
const htmlCanvas = ref()
const imagePreviewCanvas = ref<HTMLCanvasElement>()
const imageBackdropCanvas = ref<HTMLCanvasElement>()
const pasteCanvas = ref<HTMLCanvasElement>();

const moveableRuler = ref()
const moveablePaste = ref()
const moveableImage = ref()
const rulerElement = ref()
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
const imageTransform = ref({
  translate: [0, 0],
  scale: [1, 1],
  rotate: 0,
  clipType: 'inset',
  clipStyles: [0, 0, 0, 0]
});

enum HistoryEvent {
  ADD_CANVAS_ELEMENT = 1,
  REMOVE_CANVAS_ELEMENT = 2,
  UPDATE_CANVAS_ELEMENT_STYLES = 3,
  UPDATE_CANVAS_ELEMENT_OPTIONS = 4,
}

let history = ref([] as any[]);
let historyIndex = ref(-1);
const hasUndo = computed(() => historyIndex.value >= 0);
const hasRedo = computed(() => historyIndex.value < history.value.length - 1);

let elements = ref({} as any);
let canvasElements = ref([] as string[]);
const clearAllIndexes = ref([] as number[]);
const activeCanvasIndex = computed(() => clearAllIndexes.value.length > 0 ? clearAllIndexes.value[clearAllIndexes.value.length - 1] : 0);
const activeCanvasElements = computed(() => canvasElements.value.slice(activeCanvasIndex.value));
const lastCanvasElementId = computed(() => canvasElements.value[canvasElements.value.length - 1]);
const htmlElements = computed(() => activeCanvasElements.value.filter((id: any) => elements.value[id].isHTMLElement && !elements.value[id].isDeleted));

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

  const dpi = canvasConfig.value.dpi;
  canvas.value.width = canvasConfig.value.width * dpi;
  canvas.value.height = canvasConfig.value.height * dpi;

  canvas.value.style.width = `${canvasConfig.value.width}px`;
  canvas.value.style.height = `${canvasConfig.value.height}px`;

  ctx.scale(dpi, dpi);
})

watch(
  () => debugMode.value,
  () => {
    drawElements(canvas.value, activeCanvasElements.value)
  }
)

watchPostEffect(() => {
  if (ruler.value.isVisible) {
    setRulerTransform(rulerElement.value, {})
  }
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
  LINE = 33,
  CUT = 40,
  PASTE = 41,
  IMAGE = 50,
  CHECKBOX = 60,
  TEXTBOX = 61,
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
  { key: Tool.LINE, label: 'Line' },
  { key: Tool.IMAGE, label: 'Image' },
  { key: Tool.CHECKBOX, label: 'Checkbox' },
  { key: Tool.TEXTBOX, label: 'Textbox' },
  { key: Tool.CUT, label: 'Cut' },
  { key: Tool.ERASER, label: 'Eraser' },
  { key: Tool.CLEAR_ALL, label: 'Clear All' },
])
const selectedTool = ref(Tool.PEN);
const lineTools = [Tool.PEN, Tool.MARKER, Tool.HIGHLIGHTER];

enum LineEndSide {
  NONE = 0,
  ONE = 1,
  BOTH = 2,
}
const supportedLineEndSides = ref([
  { key: LineEndSide.NONE, label: 'None' },
  { key: LineEndSide.ONE, label: 'One Side' },
  { key: LineEndSide.BOTH, label: 'Both Sides' },
])
const selectedLineEndSide = ref(LineEndSide.NONE);

enum LineEndStyle {
  NONE = 0,
  ARROW = 1,
  CIRCLE = 2,
  SQUARE = 3,
}
const supportedLineEndStyles = ref([
  { key: LineEndStyle.NONE, label: 'None' },
  { key: LineEndStyle.ARROW, label: 'Arrow' },
  { key: LineEndStyle.CIRCLE, label: 'Circle' },
  { key: LineEndStyle.SQUARE, label: 'Square' },
])
const selectedLineEndStyle = ref(LineEndStyle.NONE);

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
    handleClearAll();
  }

  isTextboxEditMode.value = false
  activeTextbox.value = null

  event.target.blur();
}

function checkIsStylus(event) {
  let force = event.touches ? event.touches[0]["force"] : 0;
  isStylus.value = force > 0;
  detectedStlyus.value = detectedStlyus.value || isStylus.value;
}

function isDrawingAllowed(isDrawingOverride = false) {
  const activelyDrawing = isDrawing.value || isDrawingOverride
  const isPointerTool = selectedTool.value === Tool.POINTER
  const isOverlayMode = (
    isPasteMode.value ||
    isAddImageMode.value ||
    isInteractiveEditMode.value ||
    isMovingRuler ||
    isTextboxEditMode.value
  )
  const stylusAllowed = detectedStlyus.value && isStylus.value
  const isFingerAllowed = !isStylus.value && allowFingerDrawing.value

  return !isOverlayMode && !isPointerTool && activelyDrawing && (stylusAllowed || isFingerAllowed)
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

function formatColor(color, opacity = 1) {
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
  } else if (element.tool === Tool.LINE) {
    let strokeSize = element.strokeColor !== 'transparent' ? element.size * 0.75 : element.size / 2
    outerMinX -= strokeSize;
    outerMinY -= strokeSize;
    outerMaxX += strokeSize;
    outerMaxY += strokeSize;
  } else {
    let strokeSize = 0;
    if (element.strokeColor !== 'transparent' || element.tool === Tool.BLOB || element.tool === Tool.ERASER) {
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
    lineLength: null as number | null,
  };

  if (lineTools.includes(element.tool)) {
    dimensions.lineLength = Math.sqrt(Math.pow(dimensions.width, 2) + Math.pow(dimensions.height, 2));
  }


  return dimensions
}

function calculateLinePoints(element, toPos): any {
  const fromx = element.points[0].x;
  const fromy = element.points[0].y;
  const tox = toPos.x;
  const toy = toPos.y;

  if (
    element.toolOptions.lineEndStyle === LineEndStyle.NONE ||
    element.toolOptions.lineEndSide === LineEndSide.NONE
  ) {
    return [
      { x: fromx, y: fromy },
      { x: toPos.x, y: toPos.y }
    ]
  } else if (element.toolOptions.lineEndStyle === LineEndStyle.ARROW) {
    const headlen = element.size * 2; // length of head in pixels
    const endAngle = Math.atan2(toy - fromy, tox - fromx);
    const endA1 = {
      x: tox - headlen * Math.cos(endAngle - Math.PI / 5),
      y: toy - headlen * Math.sin(endAngle - Math.PI / 5),
    };
    const endA2 = {
      x: tox - headlen * Math.cos(endAngle + Math.PI / 5),
      y: toy - headlen * Math.sin(endAngle + Math.PI / 5),
    };
    const endPoints = [endA1, endA2]

    let startAngle;
    let startPoints: any[] = [];
    if (element.toolOptions.lineEndSide === LineEndSide.BOTH) {
      startAngle = Math.atan2(fromy - toy, fromx - tox);
      const startA1 = {
        x: fromx - headlen * Math.cos(startAngle - Math.PI / 5),
        y: fromy - headlen * Math.sin(startAngle - Math.PI / 5),
      };
      const startA2 = {
        x: fromx - headlen * Math.cos(startAngle + Math.PI / 5),
        y: fromy - headlen * Math.sin(startAngle + Math.PI / 5),
      };
      startPoints = [startA1, startA2]
    }

    return [
      { x: fromx, y: fromy },
      ...startPoints,
      ...endPoints,
      { x: toPos.x, y: toPos.y },
    ]
  } else if (
    element.toolOptions.lineEndStyle === LineEndStyle.SQUARE ||
    element.toolOptions.lineEndStyle === LineEndStyle.CIRCLE
  ) {
    const headSize = element.size * 2;
    const endStartPoint = {
      x: tox - (headSize / 2),
      y: toy - (headSize / 2),
    };
    const endEndPoint = {
      x: tox + (headSize / 2),
      y: toy + (headSize / 2),
    };
    const endPoints = [endStartPoint, endEndPoint]

    let startPoints: any[] = [];
    if (element.toolOptions.lineEndSide === LineEndSide.BOTH) {
      const startStartPoint = {
        x: fromx - (headSize / 2),
        y: fromy - (headSize / 2),
      };
      const startEndPoint = {
        x: fromx + (headSize / 2),
        y: fromy + (headSize / 2),
      };
      startPoints = [startStartPoint, startEndPoint]
    }

    return [
      { x: fromx, y: fromy },
      ...startPoints,
      ...endPoints,
      { x: toPos.x, y: toPos.y },
    ]
  }
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
          const searchDirection = searchDirections[i];
          const isInside = moveableRuler.value.isInside(searchDirection[0], searchDirection[1]);

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
  return getSvgPathFromStroke(stroke)
  // const faces = polygonClipping.union([stroke])

  // const d = []

  // faces.forEach((face) =>
  //   face.forEach((points) => {
  //     d.push(getSvgPathFromStroke(points))
  //   })
  // )

  // return d.join(' ')
}

function addHistoryEvent(event) {
  history.value.splice(historyIndex.value + 1)
  history.value.push(event);
  historyIndex.value = history.value.length - 1;
}

function getCanvasElement(elementId) {
  return elements.value[elementId];
}

function createCanvasElement(element) {
  elements.value[element.id] = element;
  canvasElements.value.push(element.id);

  const updatedElement = showCanvasElement(element.id)
  addHistoryEvent({
    type: HistoryEvent.ADD_CANVAS_ELEMENT,
    elementId: element.id,
  });

  return updatedElement;
}

function deleteCanvasElement(elementId, trackHistory = true) {
  const updatedElement = hideCanvasElement(elementId)

  if (trackHistory) {
    addHistoryEvent({
      type: HistoryEvent.REMOVE_CANVAS_ELEMENT,
      elementId: elementId,
    });
  }
  return updatedElement;
}

function showCanvasElement(elementId) {
  const element = elements.value[elementId];
  element.isDeleted = false;

  if (element.tool === Tool.CLEAR_ALL) {
    const elementIndex = canvasElements.value.indexOf(elementId);
    clearAllIndexes.value.push(elementIndex);
    clearAllIndexes.value.sort((a, b) => a - b);
  }

  return element;
}

function hideCanvasElement(elementId) {
  const element = elements.value[elementId];
  element.isDeleted = true;

  if (element.tool === Tool.CLEAR_ALL) {
    const elementIndex = canvasElements.value.indexOf(elementId);
    clearAllIndexes.value = clearAllIndexes.value.filter(i => i !== elementIndex);
  }

  return element;
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

function drawElement(canvas, element, isCaching = false) {
  if (element.isHTMLElement || element.isDeleted || element.dimensions.outerWidth === 0 || element.dimensions.outerHeight === 0) {
    return
  }

  const ctx = canvas.getContext('2d');

  if (element.isDrawingCached) {
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

  if (isCaching && (element.tool === Tool.ERASER || element.tool === Tool.CUT || element.tool === Tool.CLEAR_ALL)) {
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
  } else if (element.tool === Tool.LINE) {
    const numPoints = points.length;
    const fromx = points[0].x;
    const fromy = points[0].y;
    const tox = points[points.length - 1].x;
    const toy = points[points.length - 1].y;

    ctx.save()
    ctx.lineWidth *= 1.5;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    if (element.toolOptions.lineEndStyle === LineEndStyle.ARROW) {
      ctx.beginPath();
      for (let i = points.length - 2; i > 0; i -= 1) {
        const targetPoint = (numPoints > 4 && i <= 2) ? points[0] : points[numPoints - 1];
        ctx.moveTo(targetPoint.x, targetPoint.y);
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    } else if (element.toolOptions.lineEndStyle === LineEndStyle.SQUARE) {
      ctx.lineWidth = element.size / 2;
      ctx.beginPath();
      for (let i = 1; i < points.length - 1; i += 2) {
        const startPoint = points[i];
        const endPoint = points[i + 1];
        const width = endPoint.x - startPoint.x;
        const height = endPoint.y - startPoint.y;
        ctx.rect(startPoint.x, startPoint.y, width, height);
      }
      ctx.fill();
      ctx.stroke();
    } else if (element.toolOptions.lineEndStyle === LineEndStyle.CIRCLE) {
      ctx.lineWidth = element.size / 2;
      ctx.beginPath();
      for (let i = 1; i < points.length - 1; i += 2) {
        const startPoint = points[i];
        const endPoint = points[i + 1];
        const centerX = (startPoint.x + endPoint.x) / 2;
        const centerY = (startPoint.y + endPoint.y) / 2;
        const radius = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)) / 2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      }
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore()

    ctx.save();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    if (element.toolOptions.lineEndStyle === LineEndStyle.ARROW) {
      ctx.beginPath();
      for (let i = points.length - 2; i > 0; i -= 1) {
        const targetPoint = (numPoints > 4 && i <= 2) ? points[0] : points[numPoints - 1];
        ctx.moveTo(targetPoint.x, targetPoint.y);
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    } else if (element.toolOptions.lineEndStyle === LineEndStyle.SQUARE) {
      ctx.beginPath();
      for (let i = 1; i < points.length - 1; i += 2) {
        const startPoint = points[i];
        const endPoint = points[i + 1];
        const width = endPoint.x - startPoint.x;
        const height = endPoint.y - startPoint.y;
        ctx.rect(startPoint.x, startPoint.y, width, height);
      }
      ctx.fill();
    } else if (element.toolOptions.lineEndStyle === LineEndStyle.CIRCLE) {
      ctx.beginPath();
      for (let i = 1; i < points.length - 1; i += 2) {
        const startPoint = points[i];
        const endPoint = points[i + 1];
        const centerX = (startPoint.x + endPoint.x) / 2;
        const centerY = (startPoint.y + endPoint.y) / 2;
        const radius = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)) / 2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      }
      ctx.fill();
    }
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
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    } else {
      ctx.setLineDash([10, 10]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0000ff";
      ctx.stroke();
    }
  } else if (element.tool === Tool.CLEAR_ALL) {
    ctx.beginPath();
    const rectangle = new Path2D();
    const width = maxX - minX;
    const height = maxY - minY;
    rectangle.rect(minX, minY, width, height);
    ctx.fill(rectangle);
  }

  ctx.restore();
}

function clearCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawElements(canvas, drawElementIds) {
  clearCanvas(canvas);

  for (let i = 0; i < drawElementIds.length; i += 1) {
    const elementId = drawElementIds[i];
    const element = elements.value[elementId];
    drawElement(canvas, element);
  }
}

function getInteractiveElementTransform(element): string {
  const translate = `translate(${element.style.transform.translate[0]}px, ${element.style.transform.translate[1]}px)`;
  const scale = `scale(${element.style.transform.scale[0]}, ${element.style.transform.scale[1]})`;
  const rotate = `rotate(${element.style.transform.rotate}deg)`;

  const transformStr = `${translate} ${scale} ${rotate}`;
  return transformStr;
}

function setInteractiveElementTransform(element, transform = {}): string {
  const nextTransform = {
    ...element.style.transform,
    ...transform,
  }

  element.style.transform = nextTransform;
  element.style.transformStr = getInteractiveElementTransform(element);
  return nextTransform;
}

function handleAddCheckbox(pos) {
  const checkboxElement = {
    id: uuidv4(),
    tool: Tool.CHECKBOX,
    toolOptions: {
      isChecked: false,
    },
    style: {
      transform: {
        translate: [pos.x, pos.y],
        scale: [1, 1],
        rotate: 0,
      },
      transformStr: "",
    },
    points: [pos],
    isHTMLElement: true,
    isDeleted: false,
  };

  setInteractiveElementTransform(checkboxElement);
  createCanvasElement(checkboxElement);
}

function handleAddTextbox(pos) {
  const textboxElement = {
    id: uuidv4(),
    tool: Tool.TEXTBOX,
    isHTMLElement: true,
    isDeleted: false,
    toolOptions: {
      textContents: null,
    },
    style: {
      transform: {
        translate: [pos.x, pos.y],
        scale: [1, 1],
        rotate: 0,
      },
      transformStr: ''
    },
    points: [pos],
  };

  setInteractiveElementTransform(textboxElement);
  createCanvasElement(textboxElement);
}

function handleClearAll() {
  const lastElementId = canvasElements.value[canvasElements.value.length - 1];
  const lastElement = elements.value[lastElementId];
  if (
    canvasElements.value.length === 0 ||
    (
      canvasElements.value.length > 0 &&
      lastElement.tool === Tool.CLEAR_ALL
    )
  ) {
    return;
  }

  const clearElement = {
    id: uuidv4(),
    tool: Tool.CLEAR_ALL,
    composition: 'destination-out',
    lineWidth: 0,
    strokeColor: 'transparent',
    fillColor: { r: 255, g: 255, b: 255, a: 1 },
    points: [
      {
        x: 0,
        y: 0,
      },
      {
        x: canvasConfig.value.width,
        y: canvasConfig.value.height,
      },
    ],
    dimensions: {},
    cache: {},
  };
  clearElement.dimensions = calculateDimensions(clearElement);
  createCanvasElement(clearElement);
  cacheElement(clearElement);
  drawElements(canvas.value, activeCanvasElements.value);
  selectedTool.value = Tool.ERASER;
}

async function handlePasteStart(canvasElements) {
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


  const cutSelectionId = canvasElements[canvasElements.length - 1];
  const cutSelection = elements.value[cutSelectionId];
  cutSelection.isCompletedCut = true;
  cutSelection.composition = 'destination-out';
  cacheElement(cutSelection);
  drawElements(canvas.value, activeCanvasElements.value);

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
  for (let i = 0; i < canvasElements.length - 1; i += 1) {
    const elementId = canvasElements[i];
    const element = elements.value[elementId];
    drawElement(pasteCanvas.value, element);
  }
  const cutSelectionClip = JSON.parse(JSON.stringify(cutSelection));
  cutSelectionClip.isDrawingCached = false;
  cutSelectionClip.cache = {};
  cutSelectionClip.composition = 'destination-in';
  drawElement(pasteCanvas.value, cutSelectionClip);
}

function cancelPaste() {
  const cutSelectionId = canvasElements.value[canvasElements.value.length - 1];
  deleteCanvasElement(cutSelectionId, false);
  history.value.pop();
  isPasteMode.value = false;
}

function handlePasteEnd() {
  if (typeof pasteCanvas.value === 'undefined') {
    return;
  }

  const cutSelectionId = canvasElements.value[canvasElements.value.length - 1];
  const cutSelection = elements.value[cutSelectionId];
  const moveableRect = moveablePaste.value.getRect();
  const pasteElement = {
    id: uuidv4(),
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

  if (
    pasteTransform.value.rotate === 0
    && cutSelection.cache.drawing.x === pasteElement.dimensions.outerMinX
    && cutSelection.cache.drawing.y === pasteElement.dimensions.outerMinY
    && cutSelection.cache.drawing.width === pasteElement.dimensions.outerWidth
    && cutSelection.cache.drawing.height === pasteElement.dimensions.outerHeight
  ) {
    cancelPaste()
    drawElements(canvas.value, activeCanvasElements.value);
    return;
  }

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

  const imageWidth = pasteTransform.value.scale[0] * pasteCanvas.value.offsetWidth;
  const imageHeight = pasteTransform.value.scale[1] * pasteCanvas.value.offsetHeight;

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
    -imageWidth / 2,
    -imageHeight / 2,
    imageWidth,
    imageHeight
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

  createCanvasElement(pasteElement);
  drawElements(canvas.value, activeCanvasElements.value);
  isPasteMode.value = false;
}

function handlePasteDelete() {
  drawElements(canvas.value, activeCanvasElements.value);
  isPasteMode.value = false;
}

async function handleAddImageStart(image) {
  if (typeof canvas.value === 'undefined') {
    return;
  }

  let imageWidth = image.width;
  let imageHeight = image.height;
  let scale = 1;
  if (image.width > canvasConfig.value.width || image.height > canvasConfig.value.height) {
    scale = Math.min(canvasConfig.value.width / image.width, canvasConfig.value.height / image.height);
    imageWidth *= scale;
    imageHeight *= scale;
  }

  imageTransform.value = {
    translate: [
      canvasConfig.value.width / 2 - imageWidth / 2,
      canvasConfig.value.height / 2 - imageHeight / 2,
    ],
    scale: [scale, scale],
    rotate: 0,
    clipType: 'inset',
    clipStyles: [0, 0, 0, 0],
  };
  isAddImageMode.value = true;
  await nextTick();

  if (typeof imagePreviewCanvas.value === 'undefined' || typeof imageBackdropCanvas.value === 'undefined') {
    return;
  }

  const previewCtx = imagePreviewCanvas.value.getContext('2d');
  const backdropCtx = imageBackdropCanvas.value.getContext('2d');

  if (previewCtx === null || backdropCtx === null) {
    return;
  }

  setImageStyles(imagePreviewCanvas.value, imageTransform.value);

  const dpi = canvasConfig.value.dpi;
  imagePreviewCanvas.value.width = imageWidth * dpi;
  imagePreviewCanvas.value.height = imageHeight * dpi;
  imagePreviewCanvas.value.style.width = `${imageWidth}px`;
  imagePreviewCanvas.value.style.height = `${imageHeight}px`;
  previewCtx.scale(dpi, dpi);

  imageBackdropCanvas.value.width = imageWidth * dpi;
  imageBackdropCanvas.value.height = imageHeight * dpi;
  imageBackdropCanvas.value.style.width = `${imageWidth}px`;
  imageBackdropCanvas.value.style.height = `${imageHeight}px`;
  backdropCtx.scale(dpi, dpi);

  clearCanvas(imagePreviewCanvas.value);
  previewCtx.drawImage(image, 0, 0, imageWidth, imageHeight);

  clearCanvas(imageBackdropCanvas.value);
  backdropCtx.drawImage(image, 0, 0, imageWidth, imageHeight);
}


function handleAddImageEnd() {
  if (typeof imagePreviewCanvas.value === 'undefined') {
    return;
  }

  const moveableRect = moveableImage.value.getRect();
  const imageElement = {
    id: uuidv4(),
    tool: Tool.IMAGE,
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

  const imageCacheCanvas = document.createElement('canvas');
  const ctx = imageCacheCanvas.getContext('2d');

  if (ctx === null) {
    return;
  }

  const dpi = canvasConfig.value.dpi;
  const minX = imageElement.dimensions.outerMinX;
  const minY = imageElement.dimensions.outerMinY;
  const width = imageElement.dimensions.outerWidth;
  const height = imageElement.dimensions.outerHeight;
  const centerX = width / 2;
  const centerY = height / 2;

  imageCacheCanvas.width = width * dpi;
  imageCacheCanvas.height = height * dpi;
  imageCacheCanvas.style.width = `${width}px`;
  imageCacheCanvas.style.height = `${height}px`;

  const rotRad = imageTransform.value.rotate * Math.PI / 180;
  const imageWidth = imageTransform.value.scale[0] * imagePreviewCanvas.value.offsetWidth;
  const imageHeight = imageTransform.value.scale[1] * imagePreviewCanvas.value.offsetHeight;
  let clipValues = imageTransform.value.clipStyles
    .map((value: number | string) => typeof value === 'string' ? Number(value.split('px')[0]) : value)
    .map((value: number) => value < 0 ? 0 : value);
  clipValues[0] *= imageTransform.value.scale[1];
  clipValues[1] *= imageTransform.value.scale[0];
  clipValues[2] *= imageTransform.value.scale[1];
  clipValues[3] *= imageTransform.value.scale[0];
  const clipWidth = imageWidth - clipValues[1] - clipValues[3];
  const clipHeight = imageHeight - clipValues[0] - clipValues[2];

  ctx.save();
  ctx.scale(dpi, dpi);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotRad);
  ctx.beginPath();
  ctx.rect((-imageWidth / 2) + clipValues[3], (-imageHeight / 2) + clipValues[0], clipWidth, clipHeight);
  ctx.clip();
  ctx.fillStyle = '#ff0000';
  ctx.fill()
  ctx.drawImage(
    imagePreviewCanvas.value,
    -imageWidth / 2,
    -imageHeight / 2,
    imageWidth,
    imageHeight
  );
  ctx.restore();

  imageElement.isDrawingCached = true;
  imageElement.cache.drawing = {
    x: minX,
    y: minY,
    width,
    height,
    dpi,
    canvas: imageCacheCanvas,
  };

  createCanvasElement(imageElement);
  drawElements(canvas.value, activeCanvasElements.value);
  isAddImageMode.value = false;
}

function handleCanvasTouchStart(event) {
  if (
    activeCanvasElements.value.length === 0 &&
    (
      selectedTool.value === Tool.ERASER ||
      selectedTool.value === Tool.CUT
    )
  ) {
    return;
  }

  if (selectedTool.value === Tool.CHECKBOX || selectedTool.value === Tool.TEXTBOX) {
    return;
  }

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
  const size = selectedTool.value === Tool.CUT ? 0 : penSize.value;
  const strokeColor = selectedTool.value === Tool.CUT ? 'transparent' : selectedStrokeColor.value;
  const fillColor = selectedTool.value === Tool.CUT ? 'transparent' : selectedFillColor.value;

  const newElement = {
    id: uuidv4(),
    tool: selectedTool.value,
    fillColor,
    strokeColor,
    size,
    composition,
    opacity,
    isRulerLine,
    points: [{ x: pos.x, y: pos.y, pressure }],
    toolOptions: {
      lineEndSide: selectedLineEndSide.value,
      lineEndStyle: selectedLineEndStyle.value,
    },
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
  } else if (newElement.tool === Tool.LINE) {
    newElement.points = calculateLinePoints(newElement, pos);
  }

  if (lineTools.includes(newElement.tool)) {
    newElement.smoothPoints = getSmoothPoints(newElement);
  }
  newElement.dimensions = calculateDimensions(newElement);

  createCanvasElement(newElement);
  drawElements(canvas.value, activeCanvasElements.value);
}

function handleCanvasTouchMove(event) {
  if (!isDrawingAllowed() || canvas.value === null) {
    return;
  }

  event.preventDefault();

  const lastElementId = canvasElements.value[canvasElements.value.length - 1];
  const lastElement = elements.value[lastElementId];
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
  } else if (lastElement.tool === Tool.LINE) {
    lastElement.points = calculateLinePoints(lastElement, pos);
  } else {
    lastElement.points.push({ x: pos.x, y: pos.y, pressure });
  }

  lastElement.isRulerLine = pos.isRulerLine;

  if (lineTools.includes(lastElement.tool)) {
    lastElement.smoothPoints = getSmoothPoints(lastElement);
  }

  lastElement.dimensions = calculateDimensions(lastElement);
  drawElements(canvas.value, activeCanvasElements.value);
}

function handleCanvasTouchEnd(event) {
  if (isInteractiveEditMode.value || isTextboxEditMode.value) {
    return;
  }

  if (selectedTool.value === Tool.CHECKBOX) {
    const pos = getMousePos(canvas.value, event, true);
    handleAddCheckbox(pos);
    return;
  }

  if (selectedTool.value === Tool.TEXTBOX) {
    const pos = getMousePos(canvas.value, event, true);
    handleAddTextbox(pos);
    return;
  }

  if (isPasteMode.value) {
    handlePasteEnd()
    return;
  }

  if (!isDrawingAllowed() || canvas.value === null) {
    return;
  }

  const lastElementId = canvasElements.value[canvasElements.value.length - 1];
  const lastElement = elements.value[lastElementId];
  lastElement.freehandOptions.last = true;
  lastElement.dimensions = calculateDimensions(lastElement);

  if (lastElement.dimensions.outerWidth === 0 || lastElement.dimensions.outerHeight === 0) {
    canvasElements.value.pop();
    isDrawing.value = false;
    return;
  }

  if (lastElement.tool === Tool.CUT) {
    handlePasteStart(canvasElements.value);
  } else {
    cacheElement(lastElement);
    drawElements(canvas.value, activeCanvasElements.value);
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

function handleImageUpload(e) {
  const file = e.target.files[0];

  var reader = new FileReader();
  reader.onload = function (onloadEvent) {
    if (onloadEvent.target === null || typeof onloadEvent.target.result !== 'string') {
      return;
    }

    var img = new Image();
    img.onload = function () {
      handleAddImageStart(img);
    }

    img.src = onloadEvent.target.result;
    e.target.value = null;
  }

  reader.readAsDataURL(file);
}

function setImageStyles(target, transform) {
  if (typeof imagePreviewCanvas.value === 'undefined') {
    return;
  }
  const nextTransform = {
    ...imageTransform.value,
    ...transform,
  }

  const translate = `translate(${nextTransform.translate[0]}px, ${nextTransform.translate[1]}px)`;
  const scale = `scale(${nextTransform.scale[0]}, ${nextTransform.scale[1]})`;
  const rotate = `rotate(${nextTransform.rotate}deg)`;

  imagePreviewCanvas.value.style.transform = `${translate} ${scale} ${rotate}`;
  imagePreviewCanvas.value.style.clipPath = `${nextTransform.clipType}(${nextTransform.clipStyles.join(' ')})`;

  if (typeof imageBackdropCanvas.value !== 'undefined') {
    imageBackdropCanvas.value.style.transform = `${translate} ${scale} ${rotate}`;
  }

  imageTransform.value = nextTransform;
}

function onImageDrag({ target, translate }) {
  setImageStyles(target, { translate });
}

function onImageRotate({ target, rotate, drag }) {
  setImageStyles(target, { rotate, translate: drag.translate });
}

function onImageScale({ target, scale, drag }) {
  setImageStyles(target, { scale, translate: drag.translate });
}

function onImageClip({ target, clipType, clipStyles }) {
  setImageStyles(target, { clipType, clipStyles });
}

function handleUndoClick() {
  const action = history.value[historyIndex.value];

  if (isPasteMode.value) {
    cancelPaste();
  } else if (action.type === HistoryEvent.ADD_CANVAS_ELEMENT) {
    hideCanvasElement(action.elementId)
  } else if (action.type === HistoryEvent.REMOVE_CANVAS_ELEMENT) {
    showCanvasElement(action.elementId);
  } else if (action.type === HistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES) {
    const element = getCanvasElement(action.elementId);
    element.style = cloneDeep(action.from);
  }

  historyIndex.value -= 1;

  drawElements(canvas.value, activeCanvasElements.value);
}

function handleRedoClick() {
  const action = history.value[historyIndex.value + 1];

  if (action.type === HistoryEvent.ADD_CANVAS_ELEMENT) {
    showCanvasElement(action.elementId);
  } else if (action.type === HistoryEvent.REMOVE_CANVAS_ELEMENT) {
    hideCanvasElement(action.elementId)
  } else if (action.type === HistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES) {
    const element = getCanvasElement(action.elementId);
    element.style = cloneDeep(action.to);
  }

  historyIndex.value += 1;
  drawElements(canvas.value, activeCanvasElements.value);
}

let selectoInteractive, moveableInteractive;
let moveableElements: any[] = []
function handleStartInteractiveEdit() {
  isInteractiveEditMode.value = true;
  activeTextbox.value = null
  moveableElements = []
  selectoInteractive = new Selecto({
    container: htmlCanvas.value,
    selectableTargets: [".interactiveElement"],
    selectByClick: true,
    selectFromInside: false,
    continueSelect: false,
    toggleContinueSelect: "shift",
    hitRate: 0,
  });

  moveableInteractive = new Moveable(htmlCanvas.value, {
    draggable: true,
    rotatable: true,
    pinchable: true,
  });

  moveableInteractive
    .on("renderStart", ({ target }) => {
      handleInteractiveStart(target)
    })
    .on("renderGroupStart", e => {
      e.targets.forEach(handleInteractiveStart);
    })
    .on("clickGroup", e => {
      selectoInteractive.clickTarget(e.inputEvent, e.inputTarget);
    })
    .on("drag", handleInteractiveDrag)
    .on("dragGroup", e => {
      e.events.forEach(handleInteractiveDrag);
    })
    .on("rotate", handleInteractiveRotate)
    .on("rotateGroup", e => {
      e.events.forEach(handleInteractiveRotate);
    })
    .on("renderEnd", ({ target }) => {
      handleInteractiveEnd(target)
    })
    .on("renderGroupEnd", e => {
      e.targets.forEach(handleInteractiveEnd);
    })

  selectoInteractive
    .on("dragStart", e => {
      const target = e.inputEvent.target;
      if (
        moveableInteractive.isMoveableElement(target) ||
        moveableElements.some(t => t === target || t.contains(target))
      ) {
        e.stop();
      }
    })
    .on("select", e => {
      moveableElements = e.selected;
      moveableInteractive.target = moveableElements;
    })
    .on("selectEnd", e => {
      if (e.isDragStart) {
        e.inputEvent.preventDefault();

        setTimeout(() => {
          moveableInteractive.dragStart(e.inputEvent);
        });
      }
    });
}

function handleEndInteractiveEdit() {
  isInteractiveEditMode.value = false;
  selectoInteractive.destroy();
  moveableInteractive.destroy();
}

function setInteractiveElementStyles(target, transform) {
  const elementId = target.getAttribute('data-element-id');
  const element = getCanvasElement(elementId);

  setInteractiveElementTransform(element, transform);
  target.style.transform = element.style.transformStr;
}

function handleInteractiveDrag({ target, translate }) {
  setInteractiveElementStyles(target, { translate });
}

function handleInteractiveRotate({ target, rotate, drag }) {
  setInteractiveElementStyles(target, { rotate, translate: drag.translate });
}

function handleInteractiveStart(target) {
  const elementId = target.getAttribute('data-element-id');
  const element = getCanvasElement(elementId);
  element.tmpFromStyle = cloneDeep(element.style);
}

function handleInteractiveEnd(target) {
  const elementId = target.getAttribute('data-element-id');
  const element = getCanvasElement(elementId);
  addHistoryEvent({
    type: HistoryEvent.UPDATE_CANVAS_ELEMENT_STYLES,
    elementId: element.id,
    to: cloneDeep(element.style),
    from: cloneDeep(element.tmpFromStyle),
  });

  delete element.tmpFromStyle
}

function handleTextboxChange({ elementId, textContents }) {
  const element = getCanvasElement(elementId);
  element.toolOptions.textContents = textContents
}

function handleTextboxFocus({ elementId }) {
  if (isDrawing.value) {
    return;
  }

  isTextboxEditMode.value = true;
  selectedTool.value = Tool.TEXTBOX
  activeTextbox.value = elementId
}

function handleTextboxBlur() {
  isTextboxEditMode.value = false;
}

function handleInteractiveElementEvent(e) {
  if (!isInteractiveEditMode.value && !isDrawing.value) {
    e.stopPropagation();
  }
}

function handleElementDelete() {
  for (let i = 0; i < moveableElements.length; i += 1) {
    const elementId = moveableElements[i].getAttribute('data-element-id');
    deleteCanvasElement(elementId);
  }
  moveableElements = [];
  moveableInteractive.target = [];
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
      <div v-if="selectedTool === Tool.LINE">
        <select v-model="selectedLineEndSide">
          <option v-for="endSide in supportedLineEndSides" :key="endSide.key" :value="endSide.key">
            {{ endSide.label }}
          </option>
        </select>
        <select v-model="selectedLineEndStyle">
          <option v-for="endStyle in supportedLineEndStyles" :key="endStyle.key" :value="endStyle.key">
            {{ endStyle.label }}
          </option>
        </select>
      </div>
      <label v-else-if="selectedTool === Tool.IMAGE">
        <input type="file" accept="image/*" @change="handleImageUpload">
      </label>
      <label v-else-if="(selectedTool === Tool.CHECKBOX || selectedTool === Tool.TEXTBOX) && !isInteractiveEditMode">
        <button @click="handleStartInteractiveEdit">Edit</button>
      </label>
      <button v-if="isAddImageMode" @click="handleAddImageEnd">Done</button>
      <button v-else-if="isPasteMode" @click="handlePasteDelete">Delete Selection</button>
      <div v-else-if="isInteractiveEditMode">
        <button @click="handleElementDelete">Delete</button>
        <button @click="handleEndInteractiveEdit">Done</button>
      </div>
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
      <button :disabled="!hasUndo" @click="handleUndoClick">Undo</button>
      <button :disabled="!hasRedo" @click="handleRedoClick">Redo</button>
    </div>
    <div>
      <div class="ruler-container" v-if="ruler.isVisible" :class="{ 'hide-ruler-controls': !showRulerControls }">
        <div class="ruler" ref="rulerElement" :style="{ width: ruler.width + 'px' }">
          <div class="ruler__label">
            {{ Math.round(ruler.transform.rotate) }}&deg;
            <span v-if="canvasElements.length > 0 && isDrawing">
              <span v-if="elements[lastCanvasElementId].dimensions.lineLength">
                {{ Math.round(elements[lastCanvasElementId].dimensions.lineLength) }}px
              </span>
              <span v-else>
                {{ Math.round(elements[lastCanvasElementId].dimensions.outerWidth) }} x
                {{ Math.round(elements[lastCanvasElementId].dimensions.outerHeight) }}
              </span>
            </span>
          </div>
          <div class="ruler__tool" :style="{ width: ruler.width + 'px' }"></div>
        </div>
        <MoveableVue ref="moveableRuler" v-if="ruler.isVisible" className="moveable-ruler" :target="['.ruler']"
          :pinchable="['rotatable']" :draggable="!isDrawing" :rotatable="!isDrawing" :scalable="false"
          :throttleRotate="1" @drag="onRulerDrag" @rotate="onRulerRotate" @renderStart="onRulerMoveStart"
          @renderEnd="onRulerMoveEnd" />
      </div>

      <div v-if="isAddImageMode">
        <div class="image-container">
          <canvas class="image-canvas image-canvas--preview" ref="imagePreviewCanvas"></canvas>
          <canvas class="image-canvas image-canvas--backdrop" ref="imageBackdropCanvas"></canvas>
        </div>
        <MoveableVue ref="moveableImage" className="moveable-image" :target="['.image-canvas--preview']"
          :pinchable="true" :draggable="true" :rotatable="true" :scalable="true" :clippable="true"
          :clipTargetBounds="true" :keepRatio="true" @drag="onImageDrag" @rotate="onImageRotate" @scale="onImageScale"
          @clip="onImageClip" />
      </div>
      <div v-else-if="isPasteMode">
        <canvas class="paste_canvas" ref="pasteCanvas"></canvas>
        <MoveableVue ref="moveablePaste" className="moveable-paste" :target="['.paste_canvas']" :pinchable="true"
          :draggable="true" :rotatable="true" :scalable="true" :keepRatio="true" @drag="onPasteDrag"
          @rotate="onPasteRotate" @scale="onPasteScale" />
      </div>

      <div class="drawing-layers" @mousedown="handleCanvasTouchStart" @touchstart="handleCanvasTouchStart"
        @mouseup="handleCanvasTouchEnd" @touchend="handleCanvasTouchEnd" @mousemove="handleCanvasTouchMove"
        @touchmove="handleCanvasTouchMove"
        :style="{ width: canvasConfig.width + 'px', height: canvasConfig.height + 'px' }">
        <div ref="htmlCanvas" class="html-canvas"
          :style="{ width: canvasConfig.width + 'px', height: canvasConfig.height + 'px' }">
          <template v-for="(elementId, index) in htmlElements" :key="index">
            <input v-if="elements[elementId].tool === Tool.CHECKBOX" class="interactiveElement"
              v-model="elements[elementId].toolOptions.isChecked" :data-element-id="elements[elementId].id"
              type="checkbox" :style="{
                position: 'absolute',
                transform: getInteractiveElementTransform(elements[elementId]),
              }" @mousedown="handleInteractiveElementEvent" @touchstart="handleInteractiveElementEvent"
              @mouseup="handleInteractiveElementEvent" @touchend="handleInteractiveElementEvent"
              @mousemove="handleInteractiveElementEvent" @touchmove="handleInteractiveElementEvent" />
            <Ftextarea v-else-if="elements[elementId].tool === Tool.TEXTBOX" :data-element-id="elements[elementId].id"
              class="interactiveElement" :element="elements[elementId]"
              :is-active="elements[elementId].id === activeTextbox" @change="handleTextboxChange"
              @focus="handleTextboxFocus" @blur="handleTextboxBlur" @mousedown="handleInteractiveElementEvent"
              @touchstart="handleInteractiveElementEvent" @mouseup="handleInteractiveElementEvent"
              @touchend="handleInteractiveElementEvent" @mousemove="handleInteractiveElementEvent"
              @touchmove="handleInteractiveElementEvent" />
          </template>
        </div>
        <canvas ref="canvas" :width="canvasConfig.width" :height="canvasConfig.height">
        </canvas>
      </div>
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
  z-index: 8000;
}

.html-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.paste_canvas,
.image-container {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}

.image-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.image-canvas--preview {
  z-index: 1;
}

.image-canvas--backdrop {
  opacity: 0.5;
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

.image-clip-preview {
  position: absolute;
  z-index: 100;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
</style>

<style>
.hide-ruler-controls .moveable-ruler.moveable-control-box .moveable-rotation {
  display: none;
}

.moveable-image.moveable-control-box .moveable-control.moveable-direction.moveable-nw,
.moveable-image.moveable-control-box .moveable-control.moveable-direction.moveable-ne,
.moveable-image.moveable-control-box .moveable-control.moveable-direction.moveable-sw,
.moveable-image.moveable-control-box .moveable-control.moveable-direction.moveable-se {
  z-index: 20;
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
