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
  pageUid: TPrimaryKey;
  paletteUid: TPrimaryKey | null;
  swatchUid: TPrimaryKey | null;
  paletteType: PALETTE_TYPES;
}>();
const emits = defineEmits<{
  (e: "update", paletteUid: TPrimaryKey, swatchUid: TPrimaryKey): void;
}>();
const coreStore = useCoreStore();
const canvasStore = useCanvasStore();
const pageOptions = computed(() => {
  return canvasStore.pageOptions[props.pageUid];
});

const builtinPalette = computed(() => {
  const paletteUid = coreStore.builtinPalettes[props.paletteType]?.palette;
  return coreStore.palettes[paletteUid];
});

const color = computed(() => {
  const swatch = coreStore.getSwatchColor(props.paletteUid, props.swatchUid);
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
  pageOptions.value.isSwatchOpen = showModal.value || isDropdownOpen.value;
});

function handleCreatePalette() {
  coreStore.createPalette();
}

async function handleSwatchClick(paletteUid: TPrimaryKey, swatchUid: TPrimaryKey) {
  const selectedColor = coreStore.getSwatchColor(paletteUid, swatchUid);
  const isTransparentColor = isTransparent(selectedColor);
  const isAlreadySelected = props.paletteUid === paletteUid && props.swatchUid === swatchUid;
  const isPublicPalette = coreStore.palettes[paletteUid].isPublic;
  showModal.value = (isTransparentColor || isAlreadySelected) && !isPublicPalette;

  emits("update", paletteUid, swatchUid);
}

function handleColorChange({ color }: { color: TColor }) {
  const paletteUid: TPrimaryKey | null = props.paletteUid;
  const swatchUid: TPrimaryKey | null = props.swatchUid;
  if (
    typeof paletteUid === "undefined" ||
    paletteUid === null ||
    typeof swatchUid === "undefined" ||
    swatchUid === null
  ) {
    return;
  }

  coreStore.palettes[paletteUid].swatches[swatchUid].swatch = color;

  debouncedUpdateSwatchColor(paletteUid, swatchUid, color);
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
        :class="{ selected: props.paletteUid === paletteUid }"
        v-for="paletteUid in coreStore.defaultPaletteCollection"
        :key="paletteUid"
      >
        <div
          class="swatch__color"
          v-for="swatchUid in coreStore.palettes[paletteUid].swatchOrder"
          :key="swatchUid"
          :style="{
            background: getColorAsCss(coreStore.palettes[paletteUid].swatches[swatchUid].swatch),
          }"
          :class="{
            selected: props.swatchUid === swatchUid,
          }"
          @click="handleSwatchClick(paletteUid, swatchUid)"
        ></div>
      </div>
      <div class="swatch">
        <div
          class="swatch__color"
          v-for="swatchUid in builtinPalette.swatchOrder"
          :key="swatchUid"
          :style="{ background: getColorAsCss(builtinPalette.swatches[swatchUid].swatch) }"
          :class="{
            selected: props.paletteUid === builtinPalette.uid && props.swatchUid === swatchUid,
          }"
          @click="handleSwatchClick(builtinPalette.uid, swatchUid)"
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
