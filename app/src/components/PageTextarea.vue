<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import Quill from 'quill'
import { computed } from '@vue/reactivity';
const props = defineProps({
  element: {
    type: Object,
    required: true
  },
  isActive: {
    type: Boolean,
    required: true
  },
  colorSwatches: {
    type: Object,
    required: true
  },
})
const emit = defineEmits(['change', 'focus', 'blur'])
const toolbar = ref(null)
const editor = ref(null)
let quill;

const allowedSwatches = computed(() => {
  const { [SPECIAL_SWATCH_KEY]: omit, ...rest } = props.colorSwatches
  const solidColors: any = {}
  for (const swatch in rest) {
    const colors = rest[swatch].filter(color => !Array.isArray(color))
    if (colors.length > 0) {
      solidColors[swatch] = colors
    }
  }
  return solidColors
})


const TRANSPARENT_COLOR = { r: 0, g: 0, b: 0, a: 0 };
const SPECIAL_SWATCH_KEY = 'special';
function getColorAsCss(color) {
  if (color === TRANSPARENT_COLOR) {
    return TRANSPARENT_COLOR;
  }

  if (Array.isArray(color)) {
    const gradientStops = []
    for (let i = 0; i < color.length; i += 1) {
      const colorStop = getColorAsCss(color[i].color);
      const percent = color[i].percent;
      gradientStops.push(`${colorStop} ${percent}%`)
    }

    return `linear-gradient(135deg, ${gradientStops.join(', ')})`
  }

  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

// const Syntax = Quill.import('modules/syntax'); // get the module
// Syntax.DEFAULTS = {
//   // change (and reference your webpack import here)
//   // the default implementation of this looks for window.hljs
//   highlight: function (text) {
//     const result = hljs.highlightAuto(text);
//     return result.value;
//   },
//   interval: 500 // change interval if desired
// };

onMounted(() => {
  quill = new Quill(editor.value, {
    placeholder: 'Compose an epic...',
    modules: {
      syntax: {
        highlight: function (text) {
          const result = hljs.highlightAuto(text);
          return result.value;
        },
      },
      toolbar: toolbar.value,
    },
    theme: 'snow',
  });

  quill.setContents(props.element.toolOptions.textContents);

  quill.on('text-change', () => {
    emit('change', {
      elementId: props.element.id,
      textContents: quill.getContents(),
    })
  })

  quill.on('selection-change', (range) => {
    if (range) {
      emit('focus', { elementId: props.element.id })
    } else {
      emit('blur', { elementId: props.element.id })
    }
  });

  quill.focus()
})

</script>

<template>
  <teleport to=".tools">
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
          <optgroup v-for="swatch in allowedSwatches">
            <option v-for="color in swatch" :value="getColorAsCss(color)" :label="getColorAsCss(color)"></option>
          </optgroup>
        </select>
        <select class="ql-background">
          <optgroup v-for="swatch in allowedSwatches">
            <option v-for="color in swatch" :value="getColorAsCss(color)" :label="getColorAsCss(color)"></option>
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
