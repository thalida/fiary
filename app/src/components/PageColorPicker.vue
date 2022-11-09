<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { debounce } from "lodash";
import ColorPicker from "@mcistudio/vue-colorpicker";
import "@mcistudio/vue-colorpicker/dist/style.css";
import { getColorAsCss, isTransparent } from "@/utils/color";
import { useCanvasStore } from "@/stores/canvas";
import type { TColor, TPrimaryKey } from "@/types/core";
import { useCoreStore } from "@/stores/core";
import type { PALETTE_TYPES } from "@/constants/core";
import { randomInteger } from "@/utils/math";

const props = defineProps<{
  paletteId: TPrimaryKey | null;
  swatchId: TPrimaryKey | null;
  paletteType: PALETTE_TYPES;
}>();
const emits = defineEmits<{
  (e: "update", paletteId: TPrimaryKey, swatchId: TPrimaryKey): void;
}>();
const coreStore = useCoreStore();
const canvasStore = useCanvasStore();

const builtinPalette = computed(() => {
  const paletteId = coreStore.builtinPalettes[props.paletteType]?.palette;
  return coreStore.palettes[paletteId];
});

const color = computed(() => {
  const swatch = coreStore.getSwatchColor(props.paletteId, props.swatchId);
  return swatch;
});
const isGradient = computed(() => {
  return Array.isArray(color.value);
});
const pickerColor = computed(() => {
  if (Array.isArray(color.value)) {
    return color.value;
  }

  if (color.value.a < 1) {
    const randomColor = {
      r: randomInteger(0, 255),
      g: randomInteger(0, 255),
      b: randomInteger(0, 255),
      a: 1,
    };
    return randomColor;
  }

  return color.value;
});
const showModal = ref(false);
const isDropdownOpen = ref(false);
const debouncedUpdateSwatchColor = debounce(coreStore.updateSwatchColor, 100);

watchEffect(() => {
  canvasStore.isSwatchOpen = showModal.value || isDropdownOpen.value;
});

function handleCreatePalette() {
  coreStore.createPalette();
}

async function handleSwatchClick(paletteId: TPrimaryKey, swatchId: TPrimaryKey) {
  const selectedColor = coreStore.getSwatchColor(paletteId, swatchId);
  const isTransparentColor = isTransparent(selectedColor);
  const isAlreadySelected = props.paletteId === paletteId && props.swatchId === swatchId;
  const isPublicPalette = coreStore.palettes[paletteId].isPublic;
  showModal.value = (isTransparentColor || isAlreadySelected) && !isPublicPalette;

  emits("update", paletteId, swatchId);
}

function handleColorChange({ color }: { color: TColor }) {
  const paletteId: TPrimaryKey | null = props.paletteId;
  const swatchId: TPrimaryKey | null = props.swatchId;
  if (
    typeof paletteId === "undefined" ||
    paletteId === null ||
    typeof swatchId === "undefined" ||
    swatchId === null
  ) {
    return;
  }

  coreStore.palettes[paletteId].swatches[swatchId].swatch = color;

  debouncedUpdateSwatchColor(paletteId, swatchId, color);
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
      :mode="isGradient ? 'linear' : 'solid'"
      :color="isGradient ? {} : pickerColor"
      :gradients="isGradient ? pickerColor : []"
      @colorChanged="handleColorChange"
    >
    </ColorPicker>
    <div class="color-dropdown" v-if="!showModal && isDropdownOpen">
      <div
        class="swatch"
        :class="{ selected: props.paletteId === paletteId }"
        v-for="paletteId in coreStore.defaultPaletteCollection"
        :key="paletteId"
      >
        <div
          class="swatch__color"
          v-for="swatchId in coreStore.palettes[paletteId].swatchOrder"
          :key="swatchId"
          :style="{
            background: getColorAsCss(coreStore.palettes[paletteId].swatches[swatchId].swatch),
          }"
          :class="{
            selected: props.swatchId === swatchId,
          }"
          @click="handleSwatchClick(paletteId, swatchId)"
        ></div>
      </div>
      <div class="swatch">
        <div
          class="swatch__color"
          v-for="swatchId in builtinPalette.swatchOrder"
          :key="swatchId"
          :style="{ background: getColorAsCss(builtinPalette.swatches[swatchId].swatch) }"
          :class="{
            selected: props.paletteId === builtinPalette.pk && props.swatchId === swatchId,
          }"
          @click="handleSwatchClick(builtinPalette.pk, swatchId)"
        ></div>
      </div>
      <button @click="handleCreatePalette">Add Swatch</button>
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
