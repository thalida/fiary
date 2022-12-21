import * as solid from "./solid";
import * as dot from "./dot";
import * as square from "./square";
import * as lines from "./lines";
import * as iso from "./iso";
import { PATTERN_TYPES } from "@/constants/core";
import type { IPagePatternOptions } from "@/types/core";
import type { Component } from "vue";

const patterns: {
  [key in PATTERN_TYPES]: {
    COMPONENT: Component;
    LABEL: string;
    DEFAULT_PROPS: IPagePatternOptions;
  };
} = {
  [PATTERN_TYPES.SOLID]: solid,
  [PATTERN_TYPES.DOTS]: dot,
  [PATTERN_TYPES.SQUARES]: square,
  [PATTERN_TYPES.LINES]: lines,
  [PATTERN_TYPES.ISOMETRIC]: iso,
};

export default patterns;
export const patternOrder = [
  PATTERN_TYPES.SOLID,
  PATTERN_TYPES.DOTS,
  PATTERN_TYPES.SQUARES,
  PATTERN_TYPES.LINES,
  PATTERN_TYPES.ISOMETRIC,
];
