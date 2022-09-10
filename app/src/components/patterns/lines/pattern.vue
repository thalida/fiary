<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  lineSize: {
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
const lineYPos = computed(() => props.spacing - props.lineSize);

</script>
<template>
  <pattern x="0" y="0" :width="spacing" :height="spacing" patternUnits="userSpaceOnUse">
    <rect x="0" :y="lineYPos" :width="spacing" :height="lineSize" :fill="fillColor" />
  </pattern>
</template>
