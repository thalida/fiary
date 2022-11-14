<script setup lang="ts">
import { computed, ref, watchPostEffect } from "vue";
import MoveableVue from "vue3-moveable";
import { useCanvasStore } from "@/stores/canvas";
import type { TPrimaryKey } from "@/types/core";
import { useCoreStore } from "@/stores/core";

const props = defineProps<{ pageUid: TPrimaryKey }>();
const coreStore = useCoreStore();
const canvasStore = useCanvasStore();
const page = computed(() => coreStore.pages[props.pageUid]);
const pageOptions = computed(() => canvasStore.pageOptions[props.pageUid]);
const rootEl = ref<HTMLElement>();
const rulerEl = ref();
const moveableEl = ref();
const rulerWidth = computed(() => {
  return Math.sqrt(
    canvasStore.canvasConfig.width * canvasStore.canvasConfig.width +
      canvasStore.canvasConfig.height * canvasStore.canvasConfig.height
  );
});
const ruler = ref({
  transform: {
    translate: [0, 0],
    scale: [1, 1],
    rotate: 35,
  },
});
const showRulerControls = computed(() => {
  return !pageOptions.value.isDrawing && !pageOptions.value.isPanning;
});
const lastActiveElementUid = computed(() => {
  return coreStore.lastActiveElementUid(props.pageUid);
});
const lasElementDimensions = computed(() => {
  const lastElement = coreStore.elements[lastActiveElementUid.value];
  return lastElement ? lastElement.dimensions : null;
});

watchPostEffect(() => {
  if (pageOptions.value?.isRulerMode) {
    setRulerTransform(rulerEl.value, {});
  }
});

function setRulerTransform(
  target: HTMLElement,
  transform: { translate?: number[]; scale?: number[]; rotate?: number }
) {
  const nextTransform = {
    ...ruler.value.transform,
    ...transform,
  };

  const translate = `translate(${nextTransform.translate[0]}px, ${nextTransform.translate[1]}px)`;
  const scale = `scale(${nextTransform.scale[0]}, ${nextTransform.scale[1]})`;
  const rotate = `rotate(${nextTransform.rotate}deg)`;
  target.style.transform = `${translate} ${scale} ${rotate}`;
  ruler.value.transform = nextTransform;
}

function onRulerMoveStart() {
  pageOptions.value.isMovingRuler = true;
}

function onRulerMoveEnd() {
  pageOptions.value.isMovingRuler = false;
}

function onRulerDrag({ target, translate }: { target: HTMLElement; translate: number[] }) {
  setRulerTransform(target, { translate });
}

function onRulerRotate({
  target,
  drag,
  rotation,
}: {
  target: HTMLElement;
  drag: { translate: number[] };
  rotation: number;
}) {
  const normalizedRotation = rotation % 360;
  const absRotation = Math.abs(normalizedRotation);
  let transformRotation = normalizedRotation;

  const direction = normalizedRotation > 0 ? 1 : -1;
  const snapTargets = [0, 45, 90, 135, 180, 225, 270, 315, 360];
  const snapThreshold = 5;

  for (let i = 0; i < snapTargets.length; i += 1) {
    const target = snapTargets[i];

    if (absRotation < target && absRotation + snapThreshold >= target) {
      transformRotation = target * direction;
      break;
    } else if (absRotation > target && absRotation - snapThreshold <= target) {
      transformRotation = target * direction;
      break;
    }
  }

  setRulerTransform(target, {
    rotate: transformRotation % 360,
    translate: drag.translate,
  });
}

defineExpose({
  moveableEl,
});
</script>
<template>
  <div
    ref="rootEl"
    v-if="pageOptions && pageOptions.isRulerMode"
    class="ruler-layer"
    :class="{ 'hide-ruler-controls': !showRulerControls }"
  >
    <div class="ruler" ref="rulerEl" :style="{ width: rulerWidth + 'px' }">
      <div class="ruler__label">
        {{ Math.round(ruler.transform.rotate) }}&deg;
        <span
          v-if="
            page.elementOrder.length > 0 && pageOptions.isDrawing && lasElementDimensions !== null
          "
        >
          <span v-if="lasElementDimensions.lineLength">
            {{ Math.round(lasElementDimensions.lineLength) }}px
          </span>
          <span v-else>
            {{ Math.round(lasElementDimensions.outerWidth) }}
            x
            {{ Math.round(lasElementDimensions.outerHeight) }}
          </span>
        </span>
      </div>
      <div class="ruler__tool" :style="{ width: rulerWidth + 'px' }"></div>
    </div>
    <MoveableVue
      v-if="pageOptions.isRulerMode"
      ref="moveableEl"
      className="moveable-ruler"
      :target="['.ruler']"
      :pinchable="['rotatable']"
      :draggable="!pageOptions.isDrawing"
      :rotatable="!pageOptions.isDrawing"
      :scalable="false"
      :throttleRotate="1"
      @drag="onRulerDrag"
      @rotate="onRulerRotate"
      @renderStart="onRulerMoveStart"
      @renderEnd="onRulerMoveEnd"
    />
  </div>
</template>

<style scoped>
.ruler-layer .ruler {
  position: fixed;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  top: 50%;
  left: -5%;
  transform-origin: center center;
  transform: translate(0, 0) rotate(0deg);
}

.ruler-layer .ruler__label {
  position: absolute;
  z-index: 1;
}

.ruler-layer .ruler__tool {
  height: 100px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.5);
  background: linear-gradient(to right, rgba(255, 0, 0, 0.5) 0%, rgba(0, 0, 255, 0.5) 100%);
}
</style>

<style>
.hide-ruler-controls .ruler-layer .moveable-control-box .moveable-rotation {
  display: none;
}

.ruler-laer .moveable-control-box .moveable-control.moveable-rotation-control {
  width: 30px;
  height: 30px;
  margin-top: -15px;
  margin-left: -15px;
}

.moveable-control-box .moveable-control.moveable-origin {
  display: none;
}
</style>
