<script setup lang="ts">
import { defineProps, onMounted, ref, watch } from 'vue'
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import Quill from 'quill'
const props = defineProps({
  element: {
    type: Object,
    required: true
  },
  elementIndex: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    required: true
  },
})
const emit = defineEmits(['change', 'focus', 'blur'])
const toolbar = ref(null)
const editor = ref(null)
let quill;

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
      emit('focus', { elementIndex: props.elementIndex })
    } else {
      emit('blur', { elementIndex: props.elementIndex })
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
        <select class="ql-color"></select>
        <select class="ql-background"></select>
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
  <div v-bind="$attrs" class="editor-wrapper" :style="{
    position: 'absolute',
    transform: element.style.transformStr,
  }">
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
