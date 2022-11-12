<script setup lang="ts">
import router from "@/router";
import { computed, ref, watchEffect } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useCoreStore } from "@/stores/core";
import type { TPrimaryKey } from "@/types/core";

const authStore = useAuthStore();
const coreStore = useCoreStore();
const props = defineProps<{
  notebookUid: TPrimaryKey;
}>();

const isLoading = ref(true);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const notebook = computed(() => coreStore.notebooks[props.notebookUid]);
const isNotFound = computed(
  () => !isLoading.value && (typeof notebook.value === "undefined" || notebook.value === null)
);
const numPages = computed(() => {
  if (typeof notebook.value === "undefined" || notebook.value === null) return 0;
  return notebook.value.pageOrder.length;
});

watchEffect(async () => {
  if (isAuthenticated.value) {
    isLoading.value = true;
    await coreStore.fetchNotebook(props.notebookUid);
    isLoading.value = false;
  }
});

function handlePageCreate() {
  if (typeof notebook.value === "undefined" || notebook.value === null) return;
  coreStore.createPage(notebook.value.uid).then((page) => {
    if (page) {
      router.push({
        name: "Page",
        params: { pageUid: page.uid },
      });
    }
  });
}
</script>

<template>
  <main>
    <h1>Notebook</h1>
    <p v-if="isLoading">Loading...</p>
    <p v-else-if="isNotFound">Notebook not found.</p>
    <section v-else>
      <button @click="handlePageCreate">Create Page</button>
      <ul v-if="numPages > 0">
        <li v-for="pageUid in notebook.pageOrder" :key="pageUid">
          <RouterLink :to="{ name: 'Page', params: { pageUid: pageUid } }">
            {{ pageUid }}
          </RouterLink>
        </li>
      </ul>
      <p v-else>No pages found.</p>
    </section>
  </main>
</template>
