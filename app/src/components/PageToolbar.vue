<script setup lang="ts">
import { computed } from "vue";
import { debounce } from "lodash";
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
import { useCoreStore } from "@/stores/core";
import patterns, { patternOrder } from "@/components/PagePatterns";
import type { TPrimaryKey } from "@/types/core";

const props = defineProps<{ pageUid: TPrimaryKey }>();
const coreStore = useCoreStore();
const page = computed(() => coreStore.pages[props.pageUid]);
const colorPickerRefs: any[] = [];

const isDrawingTool = computed(() => {
  return !CANVAS_NONDRAWING_TOOLS.includes(page.value.selectedTool);
});
const isPaperTool = computed(() => {
  return CANVAS_PAPER_TOOLS.includes(page.value.selectedTool);
});
const hasUndo = computed(() => {
  return coreStore.historyIndex[props.pageUid] >= 0;
});
const hasRedo = computed(() => {
  return coreStore.historyIndex[props.pageUid] < coreStore.history[props.pageUid].length - 1;
});
const zoomPercent = computed(() => {
  const zoom = page.value.transformMatrix.a;
  const percent = Math.round(zoom * 100);
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
  (event: "action:addImage:inputChange", value: Event): void;
  (event: "action:addImage:end"): void;
  (event: "action:paste:end"): void;
  (event: "action:paste:delete"): void;
  (event: "action:saveBtn:click"): void;
}>();
const debouncedUpdatePage = debounce(coreStore.updatePage, 100);

function addColorPickerRef(ref: any) {
  if (ref !== null) {
    colorPickerRefs.push(ref);
  }
}

function handleToolChange(event: Event) {
  emit("update:tool", page.value.selectedTool);

  if (event.target) {
    (event.target as HTMLElement).blur();
  }
}

function closeAllColorPickers() {
  for (let i = 0; i < colorPickerRefs.length; i += 1) {
    colorPickerRefs[i].closeDropdown();
  }
}

function handleFillColorChange(paletteUid: TPrimaryKey, swatchUid: TPrimaryKey) {
  page.value.fillPaletteUid = paletteUid;
  page.value.fillSwatchUid = swatchUid;
}

function handleStrokeColorChange(paletteUid: TPrimaryKey, swatchUid: TPrimaryKey) {
  page.value.strokePaletteUid = paletteUid;
  page.value.strokeSwatchUid = swatchUid;
}

function handlePaperColorChange(paletteUid: TPrimaryKey, swatchUid: TPrimaryKey) {
  page.value.paperPaletteUid = paletteUid;
  page.value.paperSwatchUid = swatchUid;
  debouncedUpdatePage(props.pageUid, {
    paperSwatchUid: swatchUid,
  });
}

function handlePatternColorChange(paletteUid: TPrimaryKey, swatchUid: TPrimaryKey) {
  page.value.patternPaletteUid = paletteUid;
  page.value.patternSwatchUid = swatchUid;
  debouncedUpdatePage(props.pageUid, {
    patternSwatchUid: swatchUid,
  });
}

function handlePatternTypeChange() {
  if (typeof page.value.patternType === "undefined" || page.value.patternType === null) {
    page.value.patternType = DEFAULT_PATTERN_TYPE;
  }

  debouncedUpdatePage(props.pageUid, {
    patternType: page.value.patternType,
  });
}

function handlePatternOpacityChange() {
  debouncedUpdatePage(props.pageUid, {
    patternOptions: {
      ...page.value.patternOptions,
    },
  });
}

function handlePatternSizeChange() {
  debouncedUpdatePage(props.pageUid, {
    patternOptions: {
      ...page.value.patternOptions,
    },
  });
}

function handlePatternSpacingChange() {
  debouncedUpdatePage(props.pageUid, {
    patternOptions: {
      ...page.value.patternOptions,
    },
  });
}

function handleImageInput(event: Event) {
  emit("action:addImage:inputChange", event);
}

function handleSaveBtnClick() {
  emit("action:saveBtn:click");
}

defineExpose({
  closeAllColorPickers,
});
</script>
<template>
  <div v-if="page" class="tools">
    <select v-model="page.selectedTool" @change="handleToolChange">
      <option v-for="tool in supportedTools" :key="tool.key" :value="tool.key">
        {{ tool.label }}
      </option>
    </select>
    <div v-if="page.selectedTool === ELEMENT_TYPE.LINE">
      <select v-model="page.selectedLineEndSide">
        <option v-for="endSide in LINE_END_SIDE_CHOICES" :key="endSide.key" :value="endSide.key">
          {{ endSide.label }}
        </option>
      </select>
      <select v-model="page.selectedLineEndStyle">
        <option
          v-for="endStyle in LINE_END_STYLE_CHOICES"
          :key="endStyle.key"
          :value="endStyle.key"
        >
          {{ endStyle.label }}
        </option>
      </select>
    </div>
    <label v-else-if="page.selectedTool === ELEMENT_TYPE.IMAGE">
      <input type="file" accept="image/*" @input="handleImageInput" />
    </label>
    <label
      v-else-if="
        (page.selectedTool === ELEMENT_TYPE.CHECKBOX ||
          page.selectedTool === ELEMENT_TYPE.TEXTBOX) &&
        !page.isInteractiveEditMode
      "
    >
      <button @click="emit('action:interactiveEdit:start')">Edit</button>
    </label>
    <div v-if="page.isInteractiveEditMode">
      <button @click="emit('action:interactiveEdit:elementDelete')">Delete</button>
      <button @click="emit('action:interactiveEdit:end')">Done</button>
    </div>
    <button v-if="page.isAddImageMode" @click="emit('action:addImage:end')">Done</button>
    <button v-if="page.isPasteMode" @click="emit('action:paste:end')">Done</button>
    <button v-if="page.isPasteMode" @click="emit('action:paste:delete')">Delete Selection</button>
    <select v-if="isDrawingTool" v-model="page.selectedToolSize">
      <option v-for="size in PEN_SIZES" :key="size" :value="size">
        {{ size }}
      </option>
    </select>
    <ColorPicker
      v-if="isDrawingTool"
      style="display: inline"
      :ref="addColorPickerRef"
      :pageUid="props.pageUid"
      :paletteUid="page.fillPaletteUid"
      :swatchUid="page.fillSwatchUid"
      :paletteType="PALETTE_TYPES.TOOL_FILL"
      @update="handleFillColorChange"
    />
    <ColorPicker
      v-if="isDrawingTool"
      style="display: inline"
      :ref="addColorPickerRef"
      :pageUid="props.pageUid"
      :paletteUid="page.strokePaletteUid"
      :swatchUid="page.strokeSwatchUid"
      :paletteType="PALETTE_TYPES.TOOL_STROKE"
      @update="handleStrokeColorChange"
    />
    <select v-if="isPaperTool" v-model="page.patternType" @change="handlePatternTypeChange">
      <option v-for="patternKey in patternOrder" :key="patternKey" :value="patternKey">
        {{ patterns[patternKey].LABEL }}
      </option>
    </select>
    <ColorPicker
      v-if="isPaperTool"
      style="display: inline"
      :ref="addColorPickerRef"
      :pageUid="props.pageUid"
      :paletteUid="page.paperPaletteUid"
      :swatchUid="page.paperSwatchUid"
      :paletteType="PALETTE_TYPES.PAPER"
      @update="handlePaperColorChange"
    />
    <ColorPicker
      v-if="isPaperTool && page.patternType !== PATTERN_TYPES.SOLID"
      style="display: inline"
      :ref="addColorPickerRef"
      :pageUid="props.pageUid"
      :paletteUid="page.patternPaletteUid"
      :swatchUid="page.patternSwatchUid"
      :paletteType="PALETTE_TYPES.PATTERN"
      @update="handlePatternColorChange"
    />
    <input
      v-if="isPaperTool && page.patternType !== PATTERN_TYPES.SOLID"
      type="number"
      min="0"
      max="100"
      step="1"
      v-model.number="page.patternOptions[page.patternType].opacity"
      @change="handlePatternOpacityChange"
    />
    <input
      v-if="isPaperTool && page.patternType !== PATTERN_TYPES.SOLID"
      type="number"
      min="0"
      max="512"
      step="1"
      v-model.number="page.patternOptions[page.patternType].lineSize"
      @change="handlePatternSizeChange"
    />
    <input
      v-if="isPaperTool && page.patternType !== PATTERN_TYPES.SOLID"
      type="number"
      min="0"
      max="512"
      step="1"
      v-model.number="page.patternOptions[page.patternType].spacing"
      @change="handlePatternSpacingChange"
    />
    <label>
      <input type="checkbox" v-model="page.detectedStylus" :disabled="true" /> Detected Stylus?
    </label>
    <label>
      <input type="checkbox" v-model="page.isStylus" :disabled="true" />
      isStylus?
    </label>
    <label><input type="checkbox" v-model="page.allowFingerDrawing" /> finger?</label>
    <label><input type="checkbox" v-model="page.isDebugMode" /> debug?</label>
    <button @click="emit('action:camera:zoomOut', -0.1)">Zoom -</button>
    <button @click="emit('action:camera:zoomIn', 0.1)">Zoom +</button>
    <span>{{ zoomPercent }}%</span>
    <button :disabled="!hasUndo" @click="emit('action:history:undo')">Undo</button>
    <button :disabled="!hasRedo" @click="emit('action:history:redo')">Redo</button>
    <button @click="handleSaveBtnClick">Save</button>
  </div>
</template>

<style scoped></style>
