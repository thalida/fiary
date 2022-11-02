<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useCoreStore } from "@/stores/core";

const authStore = useAuthStore();
const coreStore = useCoreStore();

const isLoading = ref(true);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const myBookshelf = computed(() => coreStore.myBookshelf);
const notebooks = computed(() => coreStore.notebooks);
const numNotebooks = computed(() => {
  if (myBookshelf.value === null) return 0;

  return myBookshelf.value.notebookOrder.length;
});

watchEffect(() => {
  if (isAuthenticated.value) {
    isLoading.value = true;
    coreStore.fetchMyRooms().then(() => {
      isLoading.value = false;
    });
  }
});

function handleNotebookCreate() {
  coreStore.createNotebook();
}
</script>

<template>
  <main>
    <template v-if="isAuthenticated">
      <h1>My Notebooks</h1>
      <button @click="handleNotebookCreate">Create Notebook</button>
      <p v-if="isLoading">Loading...</p>
      <ul v-else-if="numNotebooks > 0">
        <li v-for="notebookPk in myBookshelf.notebookOrder" :key="notebookPk">
          <RouterLink :to="{ name: 'Notebook', params: { notebookId: notebookPk } }">
            {{ notebooks[notebookPk].title }}
          </RouterLink>
        </li>
      </ul>
      <p v-else>No notebooks found.</p>
    </template>
  </main>
</template>
