import { ELEMENT_TYPE, TRANSPARENT_COLOR } from "@/constants/core";
import type { IElementPoint, TColor } from "@/types/core";
import BaseCanvasElement from "@/models/BaseCanvasElement";

export default class ClearAllElement extends BaseCanvasElement {
  constructor({ pos }: { pos: IElementPoint }) {
    const tool = ELEMENT_TYPE.CLEAR_ALL;
    const strokeColor: TColor = TRANSPARENT_COLOR;
    const fillColor: TColor = { r: 255, g: 255, b: 255, a: 1 };

    super({ tool, strokeColor, fillColor });
    this.points = [
      {
        x: 0,
        y: 0,
      },
      {
        x: pos.x,
        y: pos.y,
      },
    ];

    this.dimensions = this.calculateDimensions();
  }
}
