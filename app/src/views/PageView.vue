<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useCoreStore } from "@/stores/core";
import Canvas from "@/components/Canvas.vue";
import type { TPrimaryKey } from "@/types/core";

const authStore = useAuthStore();
const coreStore = useCoreStore();
const props = defineProps<{
  pageId: TPrimaryKey;
}>();

const isLoading = ref(true);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const page = computed(() => coreStore.pages[props.pageId]);
const isNotFound = computed(
  () => !isLoading.value && (typeof page.value === "undefined" || page.value === null)
);

watchEffect(() => {
  if (isAuthenticated.value) {
    isLoading.value = true;
    coreStore.fetchPage(props.pageId).then(() => {
      console.log(page.value);
      isLoading.value = false;
    });
  }
});
</script>

<template>
  <main>
    <div v-if="isLoading">
      <h1>Page</h1>
      Loading...
    </div>
    <p v-else-if="isNotFound">Page not found.</p>
    <Canvas v-else />
  </main>
</template>
