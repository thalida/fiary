<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useCoreStore } from "@/stores/core";

const authStore = useAuthStore();
const coreStore = useCoreStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const myBookshelf = computed(() => coreStore.myBookshelf);

watchEffect(() => {
  if (isAuthenticated.value) {
    coreStore.fetchMyRooms();
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
      {{ myBookshelf }}
      <button @click="handleNotebookCreate">Create Notebook</button>
      <!-- <p v-if="isFetching">Loading...</p>
      <ul v-else-if="numNotebooks > 0">
        <li v-for="notebook in orderedNotebooks" :key="notebook.id">
          <RouterLink :to="{ name: 'Notebook', params: { notebookId: notebook.id } }">
            {{ notebook.title }}
          </RouterLink>
        </li>
      </ul>
      <p v-else>No notebooks found.</p> -->
    </template>
  </main>
</template>
