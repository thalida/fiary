<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  lineSize: {
    type: Number,
    default: 3,
  },
  spacing: {
    type: Number,
    default: 5,
  },
  fillColor: {
    type: String,
    default: "black",
  },
});

defineExpose({
  label: "Dotted",
});

const dotRadius = computed(() => props.lineSize / 2);
</script>
<template>
  <pattern x="0" y="0" :width="spacing" :height="spacing" patternUnits="userSpaceOnUse">
    <rect :x="0" :y="0" :width="lineSize" :height="lineSize" :rx="dotRadius" :fill="fillColor" />
  </pattern>
</template>
