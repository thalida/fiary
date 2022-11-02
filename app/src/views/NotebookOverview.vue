<script setup lang="ts">
// import router from "@/router";
// import { useNotebooksStore } from "@/stores/notebooks";
// import { ref, computed } from "vue";
// const props = defineProps<{ notebookId: string }>();
// const notebooksStore = useNotebooksStore();
// const notebook = computed(() => notebooksStore.getNotebookById(props.notebookId));
// const numPages = computed(() => notebooksStore.numNotebookPages(props.notebookId));
// const orderedPages = computed(() => notebooksStore.orderedNotebookPages(props.notebookId));
// const isFetching = ref(true);
// const isNotFound = computed(
//   () => !isFetching.value && (typeof notebook.value === "undefined" || notebook.value === null)
// );

// notebooksStore.fetchNotebook(props.notebookId).then(() => {
//   isFetching.value = false;
// });

// function handlePageCreateClick() {
//   const page = notebooksStore.createPage({ notebookId: props.notebookId });
//   router.push({ name: "NotebookPage", params: { notebookId: props.notebookId, pageId: page.id } });
// }
</script>

<template>
  <main>
    <h1>Notebook</h1>
    <!-- <p v-if="isFetching">
      Loading...
    </p>
    <p v-else-if="isNotFound">
      Notebook not found.
    </p>
    <section v-else>
      <button @click="handlePageCreateClick">
        Create Page
      </button>
      <ul v-if="numPages > 0">
        <li v-for="(page, index) in orderedPages" :key="page.id">
          <RouterLink :to="{ name: 'NotebookPage', params: { notebookId: notebook.id, pageId: page.id } }">
            {{ index + 1 }}
          </RouterLink>
        </li>
      </ul>
      <p v-else>No pages found.</p>
    </section> -->
  </main>
</template>
