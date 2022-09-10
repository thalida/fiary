<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: Number,
    default: 1,
  },
  spacing: {
    type: Number,
    default: 40,
  },
  fillColor: {
    type: String,
    default: 'black',
  },
});
const patternSize = computed(() => props.spacing);
const lineYPos = computed(() => props.spacing - props.size);

</script>
<template>
  <pattern x="0" y="0" :width="patternSize" :height="patternSize" patternUnits="userSpaceOnUse">
    <rect x="0" :y="lineYPos" :width="spacing" :height="size" :fill="fillColor" />
  </pattern>
</template>
