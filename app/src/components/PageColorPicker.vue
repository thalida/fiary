<script setup lang="ts">
import { ref, watchEffect } from "vue";
import ColorPicker from "@mcistudio/vue-colorpicker";
import "@mcistudio/vue-colorpicker/dist/style.css";
import { getColorAsCss } from "@/utils/color";
import { useCanvasStore } from "@/stores/canvas";
import type { TColor } from "@/types/core";
import { useCoreStore } from "@/stores/core";

const props = defineProps<{
  color?: TColor | null;
  swatchId?: string | null;
  colorIdx?: number | null;
  specialSwatchKey?: string;
}>();
const emits = defineEmits<{
  (e: "update", swatchId: string, colorIdx: number): void;
}>();
const coreStore = useCoreStore();
const canvasStore = useCanvasStore();

const showModal = ref(false);
const isDropdownOpen = ref(false);
watchEffect(() => {
  canvasStore.isSwatchOpen = showModal.value || isDropdownOpen.value;
});

function handleAddSwatchClick() {
  coreStore.createSwatch();
}

async function handleSwatchClick(colorIdx: number, swatchId: string) {
  const isAlreadySelected = props.swatchId === swatchId && props.colorIdx === colorIdx;
  if (isAlreadySelected && swatchId !== props.specialSwatchKey) {
    showModal.value = true;
  } else {
    showModal.value = false;
  }

  emits("update", swatchId, colorIdx);
}

function handleColorChange({ color }: { color: TColor }) {
  const swatchId = props.swatchId;
  const colorIdx = props.colorIdx;
  if (
    typeof swatchId === "undefined" ||
    swatchId === null ||
    typeof colorIdx === "undefined" ||
    colorIdx === null
  ) {
    return;
  }
  coreStore.updateSwatchColor(swatchId, colorIdx, color);
}

function closeDropdown() {
  if (showModal.value) {
    showModal.value = false;
  } else {
    isDropdownOpen.value = false;
  }
}

function toggleDropdown() {
  if (showModal.value) {
    showModal.value = false;
  } else {
    isDropdownOpen.value = !isDropdownOpen.value;
  }
}

defineExpose({
  closeDropdown,
  toggleDropdown,
});
</script>
<template>
  <div>
    <button @click="toggleDropdown">
      <div
        class="swatch__color"
        :style="{ background: color ? getColorAsCss(color) : 'transparent' }"
      ></div>
    </button>
    <ColorPicker
      v-if="showModal"
      class="color-picker"
      ref="colorPicker"
      :showPanelOnly="true"
      :supportedModes="['solid', 'linear']"
      :showOpacityPicker="false"
      :showDegreePicker="false"
      :mode="Array.isArray(color) ? 'linear' : 'solid'"
      :color="Array.isArray(color) ? {} : color"
      :gradients="Array.isArray(color) ? color : []"
      @colorChanged="handleColorChange"
    >
    </ColorPicker>
    <div class="color-dropdown" v-if="!showModal && isDropdownOpen">
      <div
        class="swatch"
        :class="{ selected: props.swatchId === swatchId }"
        v-for="swatchId in coreStore.swatchOrder"
        :key="swatchId"
      >
        <div
          class="swatch__color"
          v-for="(color, i) in coreStore.swatches[swatchId]"
          :key="i"
          :style="{ background: getColorAsCss(color) }"
          :class="{
            selected: props.swatchId === swatchId && props.colorIdx === i,
          }"
          @click="handleSwatchClick(i, swatchId)"
        ></div>
      </div>
      <div class="swatch" v-if="typeof props.specialSwatchKey !== 'undefined'">
        <div
          class="swatch__color"
          v-for="(color, i) in coreStore.swatches[props.specialSwatchKey]"
          :key="i"
          :style="{ background: getColorAsCss(color) }"
          :class="{
            selected: props.swatchId === props.specialSwatchKey && props.colorIdx === i,
          }"
          @click="handleSwatchClick(i, props.specialSwatchKey as string)"
        ></div>
      </div>
      <button @click="handleAddSwatchClick">Add Swatch</button>
    </div>
  </div>
</template>

<style scoped>
.color-dropdown {
  width: 300px;
  position: absolute;
  top: 30px;
  left: 0;
  z-index: 2;
  background: white;
}

.swatch {
  display: flex;
  flex-flow: row nowrap;
  overflow: hidden;
}

.swatch__color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid black;
  overflow: hidden;
}

.swatch__color.selected {
  border: 1px solid red;
}

.swatch__color:after {
  content: "";
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: inherit;
}

.swatch__color:before {
  content: "";
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0.2;
  background: url("@/assets/transparent-bg.png") repeat center center;
}
</style>
<style>
.color-picker {
  position: absolute;
  top: 30px;
  left: 0;
}

.color-picker .panel {
  top: 0;
}
</style>
