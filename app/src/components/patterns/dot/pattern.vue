<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: Number,
    default: 3,
  },
  spacing: {
    type: Number,
    default: 5,
  },
  fillColor: {
    type: String,
    default: 'black',
  },
});

defineExpose({
  label: 'Dotted',
});

const patternSize = computed(() => props.size + (props.spacing * 2));
const dotRadius = computed(() => props.size / 2);

</script>
<template>
  <pattern x="0" y="0" :width="patternSize" :height="patternSize" patternUnits="userSpaceOnUse">
    <rect :x="spacing" :y="spacing" :width="size" :height="size" :rx="dotRadius" :fill="fillColor" />
  </pattern>
</template>
