<script setup lang="ts">
import router from '@/router';
import { useNotebooksStore } from '@/stores/notebooks';
import { ref, computed } from '@vue/reactivity';
const notebooksStore = useNotebooksStore();
const numNotebooks = computed(() => notebooksStore.numNotebooks);
const orderedNotebooks = computed(() => notebooksStore.orderedNotebooks);
const isFetching = ref(true);

notebooksStore.fetchNotebooks().then(() => {
  isFetching.value = false;
});

function handleNotebookCreateClick() {
  const notebook = notebooksStore.createNotebook({ title: 'My Notebook' });
  router.push({ name: 'Notebook', params: { notebookId: notebook.id } });
}
</script>

<template>
  <main>
    <h1>My Notebooks</h1>
    <button @click="handleNotebookCreateClick">
      Create Notebook
    </button>
    <p v-if="isFetching">
      Loading...
    </p>
    <ul v-else-if="numNotebooks > 0">
      <li v-for="notebook in orderedNotebooks" :key="notebook.id">
        <RouterLink :to="{ name: 'Notebook', params: { notebookId: notebook.id } }">
          {{ notebook.title }}
        </RouterLink>
      </li>
    </ul>
    <p v-else>No notebooks found.</p>
  </main>
</template>
