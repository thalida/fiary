<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useUsersStore } from "@/stores/users";
const authStore = useAuthStore();
const usersStore = useUsersStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const currentUser = computed(() => usersStore.me);
</script>

<template>
  <div v-if="isAuthenticated">
    <RouterLink :to="{ name: 'Home' }">Home</RouterLink>
    <RouterLink :to="{ name: 'Signout' }">Sign out {{ currentUser?.username }}</RouterLink>
  </div>
  <div v-else>
    <RouterLink :to="{ name: 'Signin' }">Sign in</RouterLink>
    <RouterLink :to="{ name: 'Signup' }">Signup</RouterLink>
  </div>
</template>
