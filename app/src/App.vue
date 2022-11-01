<script setup lang="ts">
import { RouterView } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useUsersStore } from "@/stores/users";
import AppHeader from "@/components/AppHeader.vue";
import { computed } from "vue";

useUsersStore();
const authStore = useAuthStore();
const isFetching = computed(() => authStore.isFetching.verifyToken);
authStore.autoLogin();
</script>

<template>
  <div v-if="!isFetching">
    <AppHeader />
    <RouterView />
  </div>
</template>
