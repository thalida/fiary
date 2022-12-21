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

const patternWidth = computed(() => props.spacing * 2);
const patternHeight = computed(() => props.spacing);
const edgeLineWidth = computed(() => props.lineSize / 2);
const leftLineXPos = 0;
const rightLineXPos = computed(() => patternWidth.value - edgeLineWidth.value);
const centerLineXPos = computed(() => props.spacing - edgeLineWidth.value);
const leftDiag = computed(() => `M0 0L${patternWidth.value} ${props.spacing}`);
const rightDiag = computed(() => `M0 ${patternHeight.value}L${patternWidth.value} 0`);
</script>
<template>
  <pattern x="0" y="0" :width="patternWidth" :height="patternHeight" patternUnits="userSpaceOnUse">
    <rect
      :x="leftLineXPos"
      y="0"
      :width="edgeLineWidth"
      :height="patternHeight"
      :fill="fillColor"
    />
    <rect :x="centerLineXPos" y="0" :width="lineSize" :height="patternHeight" :fill="fillColor" />
    <rect
      :x="rightLineXPos"
      y="0"
      :width="edgeLineWidth"
      :height="patternHeight"
      :fill="fillColor"
    />
    <path :d="leftDiag" :stroke="fillColor" :stroke-width="lineSize" />
    <path :d="rightDiag" :stroke="fillColor" :stroke-width="lineSize" />
  </pattern>
</template>
