<script setup lang="ts">
import { ref } from "vue";
import { RouterView } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useUsersStore } from "@/stores/users";

useUsersStore();
const authStore = useAuthStore();
const isLoading = ref(true);
authStore.autoLogin().then(() => {
  isLoading.value = false;
});
</script>

<template>
  <template v-if="!isLoading">
    <RouterView />
  </template>
  <div v-else>Loading...</div>
</template>
