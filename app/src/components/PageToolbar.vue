<script setup lang="ts">
import { useCanvasStore } from "@/stores/canvas";
import {
  ELEMENT_TYPE,
  CANVAS_TOOL_CHOICES as supportedTools,
  LINE_END_SIDE_CHOICES,
  LINE_END_STYLE_CHOICES,
  PEN_SIZES,
  CANVAS_NONDRAWING_TOOLS,
  CANVAS_PAPER_TOOLS,
  PATTERN_TYPES,
  DEFAULT_PATTERN_TYPE,
  PALETTE_TYPES,
} from "@/constants/core";
import ColorPicker from "@/components/PageColorPicker.vue";
import { computed } from "vue";
import { useCoreStore } from "@/stores/core";
import patterns, { patternOrder } from "@/components/PagePatterns";
import type { TPrimaryKey } from "@/types/core";

const props = defineProps<{ pageId: TPrimaryKey }>();
const coreStore = useCoreStore();
const canvasStore = useCanvasStore();
const page = computed(() => coreStore.pages[props.pageId]);
const pageOptions = computed(() => canvasStore.pageOptions[props.pageId]);
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

function handleFillColorChange(paletteId: TPrimaryKey, swatchId: TPrimaryKey) {
  pageOptions.value.fillPaletteId = paletteId;
  pageOptions.value.fillSwatchId = swatchId;
}

function handleStrokeColorChange(paletteId: TPrimaryKey, swatchId: TPrimaryKey) {
  pageOptions.value.strokePaletteId = paletteId;
  pageOptions.value.strokeSwatchId = swatchId;
}

function handlePaperColorChange(paletteId: TPrimaryKey, swatchId: TPrimaryKey) {
  page.value.paperPalette = paletteId;
  page.value.paperSwatch = swatchId;
  coreStore.updatePage(props.pageId, {
    paperSwatch: swatchId,
  });
}

function handlePatternColorChange(paletteId: TPrimaryKey, swatchId: TPrimaryKey) {
  page.value.patternPalette = paletteId;
  page.value.patternSwatch = swatchId;
  coreStore.updatePage(props.pageId, {
    patternSwatch: swatchId,
  });
}

function handlePatternTypeChange() {
  if (typeof page.value.patternType === "undefined" || page.value.patternType === null) {
    page.value.patternType = DEFAULT_PATTERN_TYPE;
  }

  page.value.patternSize = patterns[page.value.patternType]
    ? patterns[page.value.patternType].DEFAULT_PROPS.lineSize
    : null;
  page.value.patternSpacing = patterns[page.value.patternType]
    ? patterns[page.value.patternType].DEFAULT_PROPS.spacing
    : null;

  coreStore.updatePage(props.pageId, {
    patternType: page.value.patternType,
    patternSize: page.value.patternSize,
    patternSpacing: page.value.patternSpacing,
  });
}

function handlePatternOpacityChange() {
  coreStore.updatePage(props.pageId, {
    patternOpacity: page.value.patternOpacity,
  });
}

function handlePatternSizeChange() {
  coreStore.updatePage(props.pageId, {
    patternSize: page.value.patternSize,
  });
}

function handlePatternSpacingChange() {
  coreStore.updatePage(props.pageId, {
    patternSpacing: page.value.patternSpacing,
  });
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
      :paletteId="pageOptions.fillPaletteId"
      :swatchId="pageOptions.fillSwatchId"
      :paletteType="PALETTE_TYPES.TOOL_FILL"
      @update="handleFillColorChange"
    />
    <ColorPicker
      v-if="isDrawingTool"
      style="display: inline"
      :ref="addColorPickerRef"
      :paletteId="pageOptions.strokePaletteId"
      :swatchId="pageOptions.strokeSwatchId"
      :paletteType="PALETTE_TYPES.TOOL_STROKE"
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
      :paletteId="page.paperPalette"
      :swatchId="page.paperSwatch"
      :paletteType="PALETTE_TYPES.PAPER"
      @update="handlePaperColorChange"
    />
    <ColorPicker
      v-if="isPaperTool && page.patternType !== PATTERN_TYPES.SOLID"
      style="display: inline"
      :ref="addColorPickerRef"
      :paletteId="page.patternPalette"
      :swatchId="page.patternSwatch"
      :paletteType="PALETTE_TYPES.PATTERN"
      @update="handlePatternColorChange"
    />
    <input
      v-if="isPaperTool && page.patternType !== PATTERN_TYPES.SOLID"
      type="number"
      min="0"
      max="100"
      step="1"
      v-model.number="page.patternOpacity"
      @change="handlePatternOpacityChange"
    />
    <input
      v-if="isPaperTool && page.patternType !== PATTERN_TYPES.SOLID"
      type="number"
      min="0"
      max="512"
      step="1"
      v-model.number="page.patternSize"
      @change="handlePatternSizeChange"
    />
    <input
      v-if="isPaperTool && page.patternType !== PATTERN_TYPES.SOLID"
      type="number"
      min="0"
      max="512"
      step="1"
      v-model.number="page.patternSpacing"
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
