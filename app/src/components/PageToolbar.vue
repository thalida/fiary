<script setup lang="ts">
import { useCanvasStore } from "@/stores/canvas";
import {
  ELEMENT_TYPE,
  CANVAS_TOOL_CHOICES as supportedTools,
  LINE_END_SIDE_CHOICES,
  LINE_END_STYLE_CHOICES,
  PEN_SIZES,
  SPECIAL_TOOL_SWATCH_KEY,
  SPECIAL_PAPER_SWATCH_KEY,
  CANVAS_NONDRAWING_TOOLS,
  CANVAS_PAPER_TOOLS,
  DEFAULT_PATTERN_COLOR_INDEX,
  PATTERN_TYPES,
  DEFAULT_PATTERN_TYPE,
  DEFAULT_ELEMENT_FILLCOLOR_INDEX,
  DEFAULT_ELEMENT_STROKECOLOR_INDEX,
  DEFAULT_SWATCH_KEY,
} from "@/constants/core";
import ColorPicker from "@/components/PageColorPicker.vue";
import { computed, reactive, ref } from "vue";
import type { TColor, TPrimaryKey } from "@/types/core";
import { useCoreStore } from "@/stores/core";
import patterns, { patternOrder } from "@/components/PagePatterns";

const props = defineProps<{ pageId: TPrimaryKey }>();
const coreStore = useCoreStore();
const canvasStore = useCanvasStore();
const page = computed(() => coreStore.pages[props.pageId]);
const sceneStore = computed(() => canvasStore.scenes[props.pageId]);
const colorPickerRefs: any[] = [];

const isDrawingTool = computed(() => {
  return !CANVAS_NONDRAWING_TOOLS.includes(sceneStore.value.selectedTool);
});
const isPaperTool = computed(() => {
  return CANVAS_PAPER_TOOLS.includes(sceneStore.value.selectedTool);
});
const hasUndo = computed(() => {
  return sceneStore.value.historyIndex >= 0;
});
const hasRedo = computed(() => {
  return sceneStore.value.historyIndex < sceneStore.value.history.length - 1;
});
const zoomPercent = computed(() => {
  const percent = Math.round(sceneStore.value.transformMatrix.a * 100);
  return percent;
});
const emit = defineEmits<{
  (event: "update:tool", tool: number): void;
  (event: "action:history:undo"): void;
  (event: "action:history:redo"): void;
  (event: "action:camera:zoomOut", zoomStep: number): void;
  (event: "action:camera:zoomIn", zoomStep: number): void;
  (event: "action:interactiveEdit:start"): void;
  (event: "action:interactiveEdit:end"): void;
  (event: "action:interactiveEdit:elementDelete"): void;
  (event: "action:addImage:inputChange", ...args: any[]): void;
  (event: "action:addImage:end"): void;
  (event: "action:paste:end"): void;
  (event: "action:paste:delete"): void;
}>();
const options = reactive({
  selectedFillSwatchId: DEFAULT_SWATCH_KEY,
  selectedFillColorIdx: DEFAULT_ELEMENT_FILLCOLOR_INDEX,
  selectedStrokeSwatchId: SPECIAL_TOOL_SWATCH_KEY,
  selectedStrokeColorIdx: DEFAULT_ELEMENT_STROKECOLOR_INDEX,
  selectedPaperSwatchId: null as string | null,
  selectedPaperColorIdx: null as number | null,
  selectedPatternSwatchId: null as string | null,
  selectedPatternColorIdx: null as number | null,
});

function addColorPickerRef(ref: any) {
  if (ref !== null) {
    colorPickerRefs.push(ref);
  }
}

function handleToolChange(event: Event) {
  emit("update:tool", sceneStore.value.selectedTool);

  if (event.target) {
    (event.target as HTMLElement).blur();
  }
}

function closeAllColorPickers() {
  for (let i = 0; i < colorPickerRefs.length; i += 1) {
    colorPickerRefs[i].closeDropdown();
  }
}

function handleFillColorChange(swatchId: string, colorIdx: number) {
  options.selectedFillSwatchId = swatchId;
  options.selectedFillColorIdx = colorIdx;
  page.value.fillColor = coreStore.getSwatchColor(swatchId, colorIdx);
}

function handleStrokeColorChange(swatchId: string, colorIdx: number) {
  options.selectedStrokeSwatchId = swatchId;
  options.selectedStrokeColorIdx = colorIdx;
  page.value.strokeColor = coreStore.getSwatchColor(swatchId, colorIdx);
}

function handlePaperColorChange(swatchId: string, colorIdx: number) {
  options.selectedPaperSwatchId = swatchId;
  options.selectedPaperColorIdx = colorIdx;
  page.value.paperColor = coreStore.getSwatchColor(swatchId, colorIdx);
}

function handlePatternColorChange(swatchId: string, colorIdx: number) {
  options.selectedPatternSwatchId = swatchId;
  options.selectedPatternColorIdx = colorIdx;
  page.value.patternColor = coreStore.getSwatchColor(swatchId, colorIdx);
}

function handlePatternTypeChange() {
  if (typeof page.value.patternType === "undefined" || page.value.patternType === null) {
    page.value.patternType = DEFAULT_PATTERN_TYPE;
  }

  options.selectedPatternSwatchId = SPECIAL_PAPER_SWATCH_KEY;
  options.selectedPatternColorIdx = DEFAULT_PATTERN_COLOR_INDEX;
  page.value.patternColor = coreStore.getSwatchColor(
    options.selectedPatternSwatchId,
    options.selectedPatternColorIdx
  );

  page.value.patternSize = patterns[page.value.patternType]
    ? patterns[page.value.patternType].DEFAULT_PROPS.lineSize
    : null;
  page.value.patternSpacing = patterns[page.value.patternType]
    ? patterns[page.value.patternType].DEFAULT_PROPS.spacing
    : null;
}

function handlePatternOpacityChange() {
  // TODO: implement
}

function handlePatternSizeChange() {
  // const target = e.target as HTMLInputElement;
  // const value = parseInt(target.value, 10);
  // page.value.patternSize = value;
}

function handlePatternSpacingChange() {
  // const target = e.target as HTMLInputElement;
  // const value = parseInt(target.value, 10);
  // page.value.patternSpacing = value;
}

defineExpose({
  closeAllColorPickers,
});
</script>
<template>
  <div v-if="sceneStore" class="tools">
    <select v-model="sceneStore.selectedTool" @change="handleToolChange">
      <option v-for="tool in supportedTools" :key="tool.key" :value="tool.key">
        {{ tool.label }}
      </option>
    </select>
    <div v-if="sceneStore.selectedTool === ELEMENT_TYPE.LINE">
      <select v-model="sceneStore.selectedLineEndSide">
        <option v-for="endSide in LINE_END_SIDE_CHOICES" :key="endSide.key" :value="endSide.key">
          {{ endSide.label }}
        </option>
      </select>
      <select v-model="sceneStore.selectedLineEndStyle">
        <option
          v-for="endStyle in LINE_END_STYLE_CHOICES"
          :key="endStyle.key"
          :value="endStyle.key"
        >
          {{ endStyle.label }}
        </option>
      </select>
    </div>
    <label v-else-if="sceneStore.selectedTool === ELEMENT_TYPE.IMAGE">
      <input type="file" accept="image/*" @change="emit('action:addImage:inputChange')" />
    </label>
    <label
      v-else-if="
        (sceneStore.selectedTool === ELEMENT_TYPE.CHECKBOX ||
          sceneStore.selectedTool === ELEMENT_TYPE.TEXTBOX) &&
        !sceneStore.isInteractiveEditMode
      "
    >
      <button @click="emit('action:interactiveEdit:start')">Edit</button>
    </label>
    <div v-if="sceneStore.isInteractiveEditMode">
      <button @click="emit('action:interactiveEdit:elementDelete')">Delete</button>
      <button @click="emit('action:interactiveEdit:end')">Done</button>
    </div>
    <button v-if="sceneStore.isAddImageMode" @click="emit('action:addImage:end')">Done</button>
    <button v-if="sceneStore.isPasteMode" @click="emit('action:paste:end')">Done</button>
    <button v-if="sceneStore.isPasteMode" @click="emit('action:paste:delete')">
      Delete Selection
    </button>
    <select v-if="isDrawingTool" v-model="sceneStore.selectedToolSize">
      <option v-for="size in PEN_SIZES" :key="size" :value="size">
        {{ size }}
      </option>
    </select>
    <ColorPicker
      v-if="isDrawingTool"
      style="display: inline"
      :ref="addColorPickerRef"
      :color="page.fillColor"
      :swatchId="options.selectedFillSwatchId"
      :colorIdx="options.selectedFillColorIdx"
      :specialSwatchKey="SPECIAL_TOOL_SWATCH_KEY"
      @update="handleFillColorChange"
    />
    <ColorPicker
      v-if="isDrawingTool"
      style="display: inline"
      :ref="addColorPickerRef"
      :color="page.strokeColor"
      :swatchId="options.selectedStrokeSwatchId"
      :colorIdx="options.selectedStrokeColorIdx"
      :specialSwatchKey="SPECIAL_TOOL_SWATCH_KEY"
      @update="handleStrokeColorChange"
    />
    <select v-if="isPaperTool" v-model="page.patternType" @change="handlePatternTypeChange">
      <option :value="PATTERN_TYPES.SOLID">Solid</option>
      <option v-for="patternKey in patternOrder" :key="patternKey" :value="patternKey">
        {{ patterns[patternKey].LABEL }}
      </option>
    </select>
    <ColorPicker
      v-if="isPaperTool && page.patternType !== PATTERN_TYPES.SOLID"
      style="display: inline"
      :ref="addColorPickerRef"
      :color="page.paperColor"
      :swatchId="options.selectedPaperSwatchId"
      :colorIdx="options.selectedPaperColorIdx"
      :specialSwatchKey="SPECIAL_PAPER_SWATCH_KEY"
      @update="handlePaperColorChange"
    />
    <ColorPicker
      v-if="isPaperTool && page.patternType !== PATTERN_TYPES.SOLID"
      style="display: inline"
      :ref="addColorPickerRef"
      :color="page.patternColor as TColor"
      :swatchId="options.selectedPatternSwatchId"
      :colorIdx="options.selectedPatternColorIdx"
      :specialSwatchKey="SPECIAL_PAPER_SWATCH_KEY"
      @update="handlePatternColorChange"
    />
    <input
      v-if="isPaperTool && page.patternType !== PATTERN_TYPES.SOLID"
      type="number"
      min="0"
      max="100"
      step="1"
      v-model="page.patternOpacity"
      @change="handlePatternOpacityChange"
    />
    <input
      v-if="isPaperTool && page.patternType !== PATTERN_TYPES.SOLID"
      type="number"
      min="0"
      max="512"
      step="1"
      v-model="page.patternSize"
      @change="handlePatternSizeChange"
    />
    <input
      v-if="isPaperTool && page.patternType !== PATTERN_TYPES.SOLID"
      type="number"
      min="0"
      max="512"
      step="1"
      v-model="page.patternSpacing"
      @change="handlePatternSpacingChange"
    />

    <label><input type="checkbox" v-model="sceneStore.isRulerMode" /> Show ruler?</label>
    <label>
      <input type="checkbox" v-model="sceneStore.detectedStylus" :disabled="true" /> Detected
      Stylus?
    </label>
    <label>
      <input type="checkbox" v-model="sceneStore.isStylus" :disabled="true" />
      isStylus?
    </label>
    <label><input type="checkbox" v-model="sceneStore.allowFingerDrawing" /> finger?</label>
    <label><input type="checkbox" v-model="sceneStore.isDebugMode" /> debug?</label>
    <button @click="emit('action:camera:zoomOut', -0.1)">Zoom -</button>
    <button @click="emit('action:camera:zoomIn', 0.1)">Zoom +</button>
    <span>{{ zoomPercent }}%</span>
    <button :disabled="!hasUndo" @click="emit('action:history:undo')">Undo</button>
    <button :disabled="!hasRedo" @click="emit('action:history:redo')">Redo</button>
  </div>
</template>

<style scoped></style>
