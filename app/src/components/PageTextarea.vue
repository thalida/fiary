<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import Quill from "quill";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { getColorAsCss } from "@/utils/color";
import type { ISolidColor, TColor } from "@/types/core";
import { SPECIAL_PAPER_SWATCH_KEY, SPECIAL_TOOL_SWATCH_KEY } from "@/constants/core";

const props = defineProps({
  element: {
    type: Object,
    required: true,
  },
  isActive: {
    type: Boolean,
    required: true,
  },
  // colorSwatches: {
  //   type: Object,
  //   required: true,
  // },
});
const emit = defineEmits(["change", "focus", "blur"]);
const toolbar = ref(null);
const editor = ref(null);
let quill: Quill;

const allowedSwatches = computed(() => {
  return [];
  // const {
  //   [SPECIAL_TOOL_SWATCH_KEY]: omit1,
  //   [SPECIAL_PAPER_SWATCH_KEY]: omit2,
  //   ...rest
  // } = props.colorSwatches;
  // const solidColors: { [key: string]: ISolidColor[] } = {};
  // for (const swatch in rest) {
  //   const colors = rest[swatch].filter((color: TColor) => !Array.isArray(color));
  //   if (colors.length > 0) {
  //     solidColors[swatch] = colors;
  //   }
  // }
  // return solidColors;
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
          <optgroup v-for="(swatch, index) in allowedSwatches" :key="index">
            <option
              v-for="(color, colorIdx) in swatch"
              :key="colorIdx"
              :value="getColorAsCss(color)"
              :label="getColorAsCss(color)"
            ></option>
          </optgroup>
        </select>
        <select class="ql-background">
          <optgroup v-for="(swatch, index) in allowedSwatches" :key="index">
            <option
              v-for="(color, colorIdx) in swatch"
              :key="colorIdx"
              :value="getColorAsCss(color)"
              :label="getColorAsCss(color)"
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
