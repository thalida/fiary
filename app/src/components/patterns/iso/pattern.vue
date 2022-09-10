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
const leftDiag = computed(() => `M0 0L${props.spacing * 2} ${props.spacing}`);
const rightDiag = computed(() => `M${props.spacing * 2} 0L0 ${props.spacing}`);

</script>
<template>

  <pattern x="0" y="0" :width="spacing * 2" :height="spacing" patternUnits="userSpaceOnUse">
    <rect x="0" y="0" :width="size" :height="spacing" :fill="fillColor" />
    <rect :x="spacing - size" y="0" :width="size" :height="spacing" :fill="fillColor" />
    <path :d="leftDiag" :stroke="fillColor" />
    <path :d="rightDiag" :stroke="fillColor" />
  </pattern>
</template>
