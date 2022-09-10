<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: Number,
    default: 1,
  },
  spacing: {
    type: Number,
    default: 20,
  },
  fillColor: {
    type: String,
    default: 'black',
  },
});
const patternSize = computed(() => props.spacing);

</script>
<template>
  <pattern x="0" y="0" :width="patternSize" :height="patternSize" patternUnits="userSpaceOnUse">
    <rect x="0" y="0" :width="spacing" :height="size" :fill="fillColor" />
    <rect x="0" y="0" :width="size" :height="spacing" :fill="fillColor" />
  </pattern>
</template>
