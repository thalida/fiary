<script setup lang="ts">
import { RouterView } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useUsersStore } from "@/stores/users";
import { useCoreStore } from "./stores/core";
import AppHeader from "@/components/AppHeader.vue";
import { computed, ref } from "vue";

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
  <div v-if="!isFetching">
    <AppHeader />
    <RouterView />
  </div>
  <div v-else>Loading...</div>
</template>
