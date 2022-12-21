<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import router from "@/router";
import { useAuthStore } from "@/stores/auth";
import { useCoreStore } from "@/stores/core";
import AppHeader from "@/components/AppHeader.vue";

const authStore = useAuthStore();
const coreStore = useCoreStore();

const isLoading = ref(true);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const myBookshelf = computed(() => coreStore.myBookshelf);
const notebooks = computed(() => coreStore.notebooks);
const numNotebooks = computed(() => {
  if (typeof myBookshelf.value === "undefined" || myBookshelf.value === null) return 0;
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
  if (typeof myBookshelf.value === "undefined" || myBookshelf.value === null) return;
  coreStore.createNotebook(myBookshelf.value.uid).then((notebook) => {
    if (notebook) {
      router.push({ name: "Notebook", params: { notebookUid: notebook.uid } });
    }
  });
}
</script>

<template>
  <AppHeader />
  <main>
    <template v-if="isAuthenticated">
      <h1>My Notebooks</h1>
      <button @click="handleNotebookCreate">Create Notebook</button>
      <p v-if="isLoading">Loading...</p>
      <ul v-else-if="myBookshelf && numNotebooks > 0">
        <li v-for="notebookUid in myBookshelf.notebookOrder" :key="notebookUid">
          <RouterLink :to="{ name: 'Notebook', params: { notebookUid: notebookUid } }">
            {{ notebooks[notebookUid].title }}
          </RouterLink>
        </li>
      </ul>
      <p v-else>No notebooks found.</p>
    </template>
  </main>
</template>
