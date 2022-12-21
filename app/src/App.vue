<script setup lang="ts">
import { ref } from "vue";
import { RouterView } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useUsersStore } from "@/stores/users";
import { useCoreStore } from "./stores/core";

useUsersStore();
const authStore = useAuthStore();
const coreStore = useCoreStore();
const isFetching = ref(true);
authStore.autoLogin().then(async () => {
  if (authStore.isAuthenticated) {
    await coreStore.fetchMyPalettes();
  }
  isFetching.value = false;
});
</script>

<template>
  <template v-if="!isFetching">
    <RouterView />
  </template>
  <div v-else>Loading...</div>
</template>
