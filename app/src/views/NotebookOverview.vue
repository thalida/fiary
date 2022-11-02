<script setup lang="ts">
import router from "@/router";
import { computed, ref, watchEffect } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useCoreStore } from "@/stores/core";
import type { TPrimaryKey } from "@/types/core";

const authStore = useAuthStore();
const coreStore = useCoreStore();
const props = defineProps<{
  notebookId: TPrimaryKey;
}>();

const isLoading = ref(true);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isNotFound = computed(
  () => !isLoading.value && (typeof notebook.value === "undefined" || notebook.value === null)
);
const notebook = computed(() => coreStore.notebooks[props.notebookId]);
const numPages = computed(() => {
  if (typeof notebook.value === "undefined" || notebook.value === null) return 0;
  return notebook.value.pageOrder.length;
});

watchEffect(() => {
  if (isAuthenticated.value) {
    isLoading.value = true;
    coreStore.fetchNotebook(props.notebookId).then(() => {
      isLoading.value = false;
    });
  }
});

function handlePageCreateClick() {
  // const page = notebooksStore.createPage({ notebookId: props.notebookId });
  router.push({ name: "NotebookPage", params: { notebookId: props.notebookId, pageId: page.id } });
}
</script>

<template>
  <main>
    <h1>Notebook</h1>
    <p v-if="isLoading">Loading...</p>
    <p v-else-if="isNotFound">Notebook not found.</p>
    <section v-else>
      <button @click="handlePageCreateClick">Create Page</button>
      <ul v-if="numPages > 0">
        <li v-for="pageId in notebook.pageOrder" :key="pageId">
          <RouterLink :to="{ name: 'NotebookPage', params: { notebookId: notebook.id, pageId: pageId } }">
            {{ pageId }}
          </RouterLink>
        </li>
      </ul>
      <p v-else>No pages found.</p>
    </section>
  </main>
</template>
