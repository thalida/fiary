import type { IPagePatternOptions } from "@/types/core";

export { default as COMPONENT } from "./pattern.vue";
export const LABEL = "Dot Grid";
export const DEFAULT_PROPS: IPagePatternOptions = {
  spacing: 30,
  lineSize: 3,
  opacity: 50,
};
