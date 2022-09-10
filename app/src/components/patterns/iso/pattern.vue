<script setup lang="ts">
import { computed } from 'vue';

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
    default: 'black',
  },
});

const patternWidth = computed(() => (props.spacing * 2) + props.lineSize);
const patternHeight = computed(() => props.spacing);
const edgeLineWidth = computed(() => props.lineSize / 2);
const rightLineXPos = computed(() => patternWidth.value - edgeLineWidth.value);
const centerLineXPos = computed(() => (patternWidth.value / 2) - (props.lineSize / 2));
const leftDiag = computed(() => `M0 0L${patternWidth.value} ${patternHeight.value}`);
const rightDiag = computed(() => `M${patternWidth.value} 0L0 ${patternHeight.value}`);
</script>
<template>
  <pattern x="0" y="0" :width="patternWidth" :height="patternHeight" patternUnits="userSpaceOnUse">
    <rect x="0" y="0" :width="edgeLineWidth" :height="patternHeight" :fill="fillColor" />
    <rect :x="rightLineXPos" y="0" :width="edgeLineWidth" :height="patternHeight" :fill="fillColor" />
    <rect :x="centerLineXPos" y="0" :width="lineSize" :height="patternHeight" :fill="fillColor" />
    <path :d="leftDiag" :stroke="fillColor" :stroke-width="lineSize" />
    <path :d="rightDiag" :stroke="fillColor" :stroke-width="lineSize" />
  </pattern>
</template>
