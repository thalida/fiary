<script setup lang="ts">
import { defineProps, onMounted, ref, watch } from 'vue'
import MoveableVue from "vue3-moveable";
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
const props = defineProps({
  element: {
    type: Object,
    required: true
  },
})
const emit = defineEmits(['change', 'focus', 'blur'])
const editor = ref(null)
let quill;

onMounted(() => {
  quill = new Quill(editor.value, {
    theme: 'bubble',
    placeholder: 'Compose an epic...',
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
    },
  });

  quill.on('text-change', () => {
    emit('change', quill.root.innerHTML)
  })

  quill.on('selection-change', (range) => {
    if (range) {
      emit('focus')
    } else {
      emit('blur')
    }
  });

  quill.focus()
})

</script>

<template>
  <div class="editor-wrapper" :style="{
    position: 'absolute',
    transform: element.style.transformStr,
  }">
    <div ref="editor"></div>
  </div>
</template>

<style>
.editor-wrapper {
  min-width: 200px;
  min-height: 100px;
}

.ql-bubble .ql-tooltip {
  width: 500px !important;
}
</style>
