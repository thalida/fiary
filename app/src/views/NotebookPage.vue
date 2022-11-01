<script setup lang="ts">
import router from '@/router';
import { useNotebooksStore } from '@/stores/notebooks';
import { ref, computed } from '@vue/reactivity';
import Canvas from "@/components/Canvas.vue";

const props = defineProps<{ notebookId: string, pageId: string }>();
const notebooksStore = useNotebooksStore();
const page = computed(() => notebooksStore.getNotebookPageById(props.notebookId, props.pageId));
const isFetching = ref(true);
const isNotFound = computed(() => !isFetching.value && (typeof page.value === 'undefined' || page.value === null));

notebooksStore.fetchNotebookPage(props.notebookId, props.pageId).then(() => {
  isFetching.value = false;
});
</script>

<template>
  <main>
    <div v-if="isFetching">
      <h1>Page</h1>
      Loading...
    </div>
    <p v-else-if="isNotFound">
      Page not found.
    </p>
    <Canvas v-else />
  </main>
</template>
