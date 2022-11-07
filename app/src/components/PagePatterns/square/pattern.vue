<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  lineSize: {
    type: Number,
    default: 1,
  },
  spacing: {
    type: Number,
    default: 20,
  },
  fillColor: {
    type: String,
    default: "black",
  },
});
</script>
<template>
  <pattern x="0" y="0" :width="spacing" :height="spacing" patternUnits="userSpaceOnUse">
    <rect x="0" y="0" :width="spacing" :height="lineSize" :fill="fillColor" />
    <rect x="0" y="0" :width="lineSize" :height="spacing" :fill="fillColor" />
  </pattern>
</template>
