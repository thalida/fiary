<script setup lang="ts">
import type CheckboxElement from "@/models/elements/CheckboxElement";
import { useCoreStore } from "@/stores/core";
import type { TPrimaryKey } from "@/types/core";
import { computed } from "vue";

const props = defineProps<{ elementUid: TPrimaryKey }>();
const emits = defineEmits(["change"]);
const coreStore = useCoreStore();
const element = computed(() => coreStore.elements[props.elementUid] as CheckboxElement);
</script>

<template>
  <input
    v-model="element.settings.isChecked"
    type="checkbox"
    @change="$emit('change', elementUid)"
  />
</template>
<style scoped></style>
