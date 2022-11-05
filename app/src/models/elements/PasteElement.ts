import { ELEMENT_TYPE, TRANSPARENT_COLOR } from "@/constants/core";
import type { TColor } from "@/types/core";
import BaseCanvasElement from "@/models/BaseCanvasElement";

export default class PasteElement extends BaseCanvasElement {
  cutRect: { left: number; top: number; width: number; height: number };
  constructor(cutRect: { left: number; top: number; width: number; height: number }) {
    const tool = ELEMENT_TYPE.PASTE;
    const strokeColor: TColor = TRANSPARENT_COLOR;
    const fillColor: TColor = { r: 255, g: 255, b: 255, a: 1 };

    super({ tool, strokeColor, fillColor });

    this.cutRect = cutRect;
    this.dimensions = this.calculateDimensions();
  }

  calculateDimensions() {
    return {
      minX: this.cutRect.left,
      minY: this.cutRect.top,
      maxX: this.cutRect.left + this.cutRect.width,
      maxY: this.cutRect.top + this.cutRect.height,
      outerMaxX: this.cutRect.left + this.cutRect.width,
      outerMaxY: this.cutRect.top + this.cutRect.height,
      width: this.cutRect.width,
      height: this.cutRect.height,
      lineLength: null,
      outerMinX: this.cutRect.left,
      outerMinY: this.cutRect.top,
      outerWidth: this.cutRect.width,
      outerHeight: this.cutRect.height,
    };
  }
}
