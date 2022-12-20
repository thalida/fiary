<script setup lang="ts">
import router from "@/router";
import { useAuthStore } from "@/stores/auth";
const authStore = useAuthStore();
authStore.logout();
router.push({ name: "Home" });
</script>

<template>
  <div></div>
</template>
