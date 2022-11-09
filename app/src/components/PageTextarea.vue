<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import Quill from "quill";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { getColorAsCss, isTransparent } from "@/utils/color";
import type { IPaletteSwatch, ISolidColor, TColor } from "@/types/core";
import { useCoreStore } from "@/stores/core";
import { filter } from "lodash";
import { PALETTE_TYPES } from "@/constants/core";

const props = defineProps({
  element: {
    type: Object,
    required: true,
  },
  isActive: {
    type: Boolean,
    required: true,
  },
});
const coreStore = useCoreStore();
const emit = defineEmits(["change", "focus", "blur"]);
const toolbar = ref(null);
const editor = ref(null);
let quill: Quill;

const supportedPalettes = computed(() => {
  let paletteOrder = [coreStore.builtinPalettes[PALETTE_TYPES.TOOL_FILL]?.palette];

  const defaultPalette = coreStore.defaultPaletteCollection;
  if (defaultPalette) {
    paletteOrder = paletteOrder.concat(defaultPalette);
  }

  if (paletteOrder.length === 0) {
    return [];
  }

  const solidColors: IPaletteSwatch[][] = [];
  for (const paletteId of paletteOrder) {
    const palette = coreStore.palettes[paletteId];
    if (typeof palette === "undefined" || palette === null) {
      continue;
    }
    const solidOnly = filter(palette.swatches, ({ swatch }) => {
      return !Array.isArray(swatch) && !isTransparent(swatch);
    });
    solidColors.push(solidOnly);
  }

  return solidColors;
});

onMounted(() => {
  quill = new Quill(editor.value, {
    placeholder: "Compose an epic...",
    modules: {
      syntax: {
        highlight: function (text: string) {
          const result = hljs.highlightAuto(text);
          return result.value;
        },
      },
      toolbar: toolbar.value,
    },
    theme: "snow",
  });

  quill.setContents(props.element.toolOptions.textContents);

  quill.on("text-change", () => {
    emit("change", {
      elementId: props.element.id,
      textContents: quill.getContents(),
    });
  });

  quill.on("selection-change", (range) => {
    if (range) {
      emit("focus", { elementId: props.element.id });
    } else {
      emit("blur", { elementId: props.element.id });
    }
  });

  quill.focus();
});
</script>

<template>
  <teleport to=".toolbar">
    <div v-show="isActive" class="toolbar" ref="toolbar">
      <span class="ql-formats">
        <select class="ql-font"></select>
        <select class="ql-header"></select>
      </span>
      <span class="ql-formats">
        <button class="ql-bold"></button>
        <button class="ql-italic"></button>
        <button class="ql-underline"></button>
        <button class="ql-strike"></button>
      </span>
      <span class="ql-formats">
        <select class="ql-color">
          <optgroup v-for="(palette, index) in supportedPalettes" :key="index">
            <option
              v-for="swatch in palette"
              :key="swatch.pk"
              :value="getColorAsCss(swatch.swatch)"
              :label="getColorAsCss(swatch.swatch)"
            ></option>
          </optgroup>
        </select>
        <select class="ql-background">
          <optgroup v-for="(palette, index) in supportedPalettes" :key="index">
            <option
              v-for="swatch in palette"
              :key="swatch.pk"
              :value="getColorAsCss(swatch.swatch)"
              :label="getColorAsCss(swatch.swatch)"
            ></option>
          </optgroup>
        </select>
      </span>
      <span class="ql-formats">
        <button class="ql-script" value="sub"></button>
        <button class="ql-script" value="super"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-blockquote"></button>
        <button class="ql-code-block"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-list" value="ordered"></button>
        <button class="ql-list" value="bullet"></button>
        <button class="ql-indent" value="-1"></button>
        <button class="ql-indent" value="+1"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-direction" value="rtl"></button>
        <select class="ql-align"></select>
      </span>
      <span class="ql-formats">
        <button class="ql-link"></button>
        <button class="ql-formula"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-clean"></button>
      </span>
    </div>
  </teleport>
  <div v-bind="$attrs" class="editor-wrapper">
    <div ref="editor"></div>
  </div>
</template>

<style scoped>
.editor-wrapper {
  min-width: 200px;
}

.ql-container.ql-snow {
  border: 0;
}

.ql-editor {
  padding: 0;
}
</style>
