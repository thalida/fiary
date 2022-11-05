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
} from "@/constants/core";
import ColorPicker from "@/components/PageColorPicker.vue";
import { computed, nextTick, ref } from "vue";
import type { TPrimaryKey } from "@/types/core";

const props = defineProps<{ pageId: TPrimaryKey }>();
const canvasStore = useCanvasStore();
const sceneStore = computed(() => canvasStore.scenes[props.pageId]);
const colorPickerRefs: any[] = [];
const selectedPatternStyles = computed(() => {
  return canvasStore.getPaperPatternPropsByIdx(sceneStore.value.selectedPaperPatternIdx);
});
const zoomPercent = ref();
const emit = defineEmits<{
  (event: "update:tool", tool: number): void;
  (event: "action:history:undo"): void;
  (event: "action:history:redo"): void;
  (event: "action:camera:zoomOut"): void;
  (event: "action:camera:zoomIn"): void;
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
  sceneStore.value.isTextboxEditMode = false;
  sceneStore.value.activeElementId = null;

  emit("update:tool", sceneStore.value.selectedTool);

  if (event.target) {
    (event.target as HTMLElement).blur();
  }
}

async function handleZoomOut() {
  if (typeof sceneStore.value === "undefined") {
    return;
  }

  const percent = sceneStore.value.zoomOut();
  zoomPercent.value = percent;

  await nextTick();
  emit("action:camera:zoomOut");
}

async function handleZoomIn() {
  if (typeof sceneStore.value === "undefined") {
    return;
  }

  const percent = sceneStore.value.zoomIn();
  zoomPercent.value = percent;

  await nextTick();
  emit("action:camera:zoomIn");
}

function closeAllColorPickers() {
  for (let i = 0; i < colorPickerRefs.length; i += 1) {
    colorPickerRefs[i].closeDropdown();
  }
}

function handleFillColorChange(swatchId: string, colorIdx: number) {
  sceneStore.value.selectedFillSwatchId = swatchId;
  sceneStore.value.selectedFillColorIdx = colorIdx;
}

function handleStrokeColorChange(swatchId: string, colorIdx: number) {
  sceneStore.value.selectedStrokeSwatchId = swatchId;
  sceneStore.value.selectedStrokeColorIdx = colorIdx;
}

function handlePaperColorChange(swatchId: string, colorIdx: number) {
  sceneStore.value.selectedPaperSwatchId = swatchId;
  sceneStore.value.selectedPaperColorIdx = colorIdx;
}

function handlePatternColorChange(swatchId: string, colorIdx: number) {
  sceneStore.value.selectedPatternSwatchId = swatchId;
  sceneStore.value.selectedPatternColorIdx = colorIdx;
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
    <select v-if="sceneStore.isDrawingTool" v-model="sceneStore.selectedToolSize">
      <option v-for="size in PEN_SIZES" :key="size" :value="size">
        {{ size }}
      </option>
    </select>
    <ColorPicker
      v-if="sceneStore.isDrawingTool"
      style="display: inline"
      :ref="addColorPickerRef"
      :swatchId="sceneStore.selectedFillSwatchId"
      :colorIdx="sceneStore.selectedFillColorIdx"
      :specialSwatchKey="SPECIAL_TOOL_SWATCH_KEY"
      @update="handleFillColorChange"
    />
    <ColorPicker
      v-if="sceneStore.isDrawingTool"
      style="display: inline"
      :ref="addColorPickerRef"
      :swatchId="sceneStore.selectedStrokeSwatchId"
      :colorIdx="sceneStore.selectedStrokeColorIdx"
      :specialSwatchKey="SPECIAL_TOOL_SWATCH_KEY"
      @update="handleStrokeColorChange"
    />
    <select v-if="sceneStore.isPaperTool" v-model="sceneStore.selectedPaperPatternIdx">
      <option v-for="(pattern, index) in canvasStore.paperPatterns" :key="index" :value="index">
        {{ pattern.LABEL }}
      </option>
    </select>
    <ColorPicker
      v-if="sceneStore.isPaperTool"
      style="display: inline"
      :ref="addColorPickerRef"
      :swatchId="sceneStore.selectedPaperSwatchId"
      :colorIdx="sceneStore.selectedPaperColorIdx"
      :specialSwatchKey="SPECIAL_PAPER_SWATCH_KEY"
      @update="handlePaperColorChange"
    />
    <ColorPicker
      v-if="sceneStore.isPaperTool"
      style="display: inline"
      :ref="addColorPickerRef"
      :swatchId="sceneStore.selectedPatternSwatchId"
      :colorIdx="sceneStore.selectedPatternColorIdx"
      :specialSwatchKey="SPECIAL_PAPER_SWATCH_KEY"
      @update="handlePatternColorChange"
    />
    <input
      v-if="sceneStore.isPaperTool"
      type="number"
      min="0"
      max="100"
      step="1"
      v-model="sceneStore.selectedPatternOpacity"
    />
    <input
      v-if="sceneStore.isPaperTool"
      type="number"
      min="0"
      max="512"
      step="1"
      v-model="selectedPatternStyles.lineSize"
    />
    <input
      v-if="sceneStore.isPaperTool"
      type="number"
      min="0"
      max="512"
      step="1"
      v-model="selectedPatternStyles.spacing"
    />

    <label><input type="checkbox" v-model="sceneStore.ruler.isVisible" /> Show ruler?</label>
    <label
      ><input type="checkbox" v-model="sceneStore.detectedStylus" :disabled="true" /> Detected
      Stylus?</label
    >
    <label
      ><input type="checkbox" v-model="sceneStore.isStylus" :disabled="true" />
      sceneStore.isStylus?</label
    >
    <label><input type="checkbox" v-model="sceneStore.allowFingerDrawing" /> finger?</label>
    <label><input type="checkbox" v-model="sceneStore.debugMode" /> debug?</label>
    <button @click="handleZoomOut">Zoom -</button>
    <button @click="handleZoomIn">Zoom +</button>
    <span>{{ zoomPercent }}%</span>
    <button :disabled="!sceneStore.hasUndo" @click="emit('action:history:undo')">Undo</button>
    <button :disabled="!sceneStore.hasRedo" @click="emit('action:history:redo')">Redo</button>
  </div>
</template>

<style scoped></style>
