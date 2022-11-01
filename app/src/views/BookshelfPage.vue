<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRoomsStore } from "@/stores/rooms";

const authStore = useAuthStore();
const roomsStore = useRoomsStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);

watchEffect(() => {
  // if (isAuthenticated.value) {
  //   roomsStore.fetchMyRooms();
  // }
  // console.log(isAuthenticated.value);
});

// roomsStore.fetchMyRooms();

// function handleNotebookCreate() {
//   notebooksStore.createNotebook();
// }
</script>

<template>
  <main>
    <template v-if="isAuthenticated">
      <h1>My Notebooks</h1>
      <!-- <button @click="handleNotebookCreate">Create Notebook</button> -->
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
