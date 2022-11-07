import { defineStore } from "pinia";
import { computed, reactive, ref, type UnwrapNestedRefs } from "vue";
import type { TPrimaryKey } from "@/types/core";
import PageScene from "@/models/PageScene";

export const useCanvasStore = defineStore("canvas", () => {
  const canvasConfig = ref({
    width: window.innerWidth,
    height: window.innerHeight,
    dpi: window.devicePixelRatio,
  });
  const canvasDiagSize = computed(() => {
    return Math.sqrt(
      canvasConfig.value.width * canvasConfig.value.width +
        canvasConfig.value.height * canvasConfig.value.height
    );
  });

  const scenes = reactive({} as { [key: TPrimaryKey]: UnwrapNestedRefs<PageScene> });
  function setupSceneStore(
    pageId: TPrimaryKey,
    matrix: { a: number; b: number; c: number; d: number; e: number; f: number }
  ) {
    scenes[pageId] = new PageScene(pageId, matrix) as unknown as UnwrapNestedRefs<PageScene>;
  }
  const isSwatchOpen = ref(false);

  return {
    scenes,
    setupSceneStore,
    canvasConfig,
    canvasDiagSize,
    isSwatchOpen,
  };
});
