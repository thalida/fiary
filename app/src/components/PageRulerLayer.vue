<script setup lang="ts">
import { computed, ref, watchPostEffect } from "vue";
import MoveableVue from "vue3-moveable";
import { useCanvasStore } from "@/stores/canvas";
import type { TPrimaryKey } from "@/types/core";

const props = defineProps<{ pageId: TPrimaryKey }>();
const canvasStore = useCanvasStore();
const sceneStore = computed(() => canvasStore.scenes[props.pageId]);
const rootEl = ref<HTMLElement>();
const rulerEl = ref();
const moveableEl = ref();
const ruler = ref({
  width: canvasStore.canvasDiagSize,
  transform: {
    translate: [0, 0],
    scale: [1, 1],
    rotate: 35,
  },
});

watchPostEffect(() => {
  if (sceneStore.value?.isRulerMode) {
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
  sceneStore.value.isMovingRuler = true;
}

function onRulerMoveEnd() {
  sceneStore.value.isMovingRuler = false;
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
    v-if="sceneStore && sceneStore.isRulerMode"
    class="ruler-layer"
    :class="{ 'hide-ruler-controls': !sceneStore.showRulerControls }"
  >
    <div class="ruler" ref="rulerEl" :style="{ width: ruler.width + 'px' }">
      <div class="ruler__label">
        {{ Math.round(ruler.transform.rotate) }}&deg;
        <span v-if="sceneStore.elementOrder.length > 0 && sceneStore.isDrawing">
          <span v-if="sceneStore.elements[sceneStore.lastActiveElementId].dimensions.lineLength">
            {{
              Math.round(sceneStore.elements[sceneStore.lastActiveElementId].dimensions.lineLength)
            }}px
          </span>
          <span v-else>
            {{
              Math.round(sceneStore.elements[sceneStore.lastActiveElementId].dimensions.outerWidth)
            }}
            x
            {{
              Math.round(sceneStore.elements[sceneStore.lastActiveElementId].dimensions.outerHeight)
            }}
          </span>
        </span>
      </div>
      <div class="ruler__tool" :style="{ width: ruler.width + 'px' }"></div>
    </div>
    <MoveableVue
      v-if="sceneStore.isRulerMode"
      ref="moveableEl"
      className="moveable-ruler"
      :target="['.ruler']"
      :pinchable="['rotatable']"
      :draggable="!sceneStore.isDrawing"
      :rotatable="!sceneStore.isDrawing"
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
