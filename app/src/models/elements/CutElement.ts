import { ELEMENT_TYPE } from "@/constants/core";
import BaseCanvasElement from "@/models/BaseCanvasElement";
import type { ICutElementSettings } from "@/types/core";

export default class CutElement extends BaseCanvasElement {
  tool: ELEMENT_TYPE = ELEMENT_TYPE.CUT;
  settings: ICutElementSettings = {
    isCompletedCut: false,
  };
}
