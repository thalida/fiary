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

const patternSize = computed(() => props.lineSize + props.spacing * 2);
const dotRadius = computed(() => props.lineSize / 2);
</script>
<template>
  <pattern x="0" y="0" :width="patternSize" :height="patternSize" patternUnits="userSpaceOnUse">
    <rect :x="spacing" :y="spacing" :width="lineSize" :height="lineSize" :rx="dotRadius" :fill="fillColor" />
  </pattern>
</template>
