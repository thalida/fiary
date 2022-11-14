import { ELEMENT_TYPE, LineEndSide, LineEndStyle } from "@/constants/core";
import BaseCanvasElement from "@/models/BaseCanvasElement";
import type { ILineElementSettings } from "@/types/core";

export default class LineElement extends BaseCanvasElement {
  tool = ELEMENT_TYPE.LINE;
  settings: ILineElementSettings = {
    lineEndSide: LineEndSide.NONE,
    lineEndStyle: LineEndStyle.NONE,
  };

  constructor(element: { pageUid: string; tool: ELEMENT_TYPE } & Partial<ILineElementSettings>) {
    super(element);
    this.points = this.calculateLinePoints(this.points[0]);
  }
}
