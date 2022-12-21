<script setup lang="ts">
defineProps({
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
  <pattern x="0" y="0" :width="spacing" :height="spacing" patternUnits="userSpaceOnUse"></pattern>
</template>
