<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watchEffect } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useCoreStore } from "@/stores/core";
import PageScene from "@/components/PageScene.vue";
import type { TPrimaryKey } from "@/types/core";

const authStore = useAuthStore();
const coreStore = useCoreStore();
const props = defineProps<{
  pageUid: TPrimaryKey;
}>();

const isLoading = ref(true);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const page = computed(() => coreStore.pages[props.pageUid]);
const isNotFound = computed(
  () => !isLoading.value && (typeof page.value === "undefined" || page.value === null)
);

watchEffect(() => {
  if (isAuthenticated.value) {
    isLoading.value = true;
    coreStore.fetchPage(props.pageUid).then(() => {
      // coreStore.fetchElements(props.pageUid).then(() => {
      //   isLoading.value = false;
      // });
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
    <PageScene v-else :pageUid="props.pageUid" />
  </main>
</template>
