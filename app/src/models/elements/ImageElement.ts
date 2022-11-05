import { CanvasTool, TRANSPARENT_COLOR } from "@/constants/core";
import type { TColor } from "@/types/core";
import BaseCanvasElement from "@/models/BaseCanvasElement";

export default class ImageElement extends BaseCanvasElement {
  imageRect: any;
  constructor(image, imageRect: any) {
    const tool = CanvasTool.IMAGE;
    const strokeColor: TColor = TRANSPARENT_COLOR;
    const fillColor: TColor = { r: 255, g: 255, b: 255, a: 1 };

    super({ tool, strokeColor, fillColor });

    this.toolOptions = {
      image,
    };
    this.imageRect = imageRect;
    this.dimensions = this.calculateDimensions();
    this.isDrawingCached = true;
  }

  calculateDimensions() {
    return {
      minX: this.imageRect.left,
      minY: this.imageRect.top,
      maxX: this.imageRect.left + this.imageRect.width,
      maxY: this.imageRect.top + this.imageRect.height,
      outerMaxX: this.imageRect.left + this.imageRect.width,
      outerMaxY: this.imageRect.top + this.imageRect.height,
      width: this.imageRect.width,
      height: this.imageRect.height,
      lineLength: null,
      outerMinX: this.imageRect.left,
      outerMinY: this.imageRect.top,
      outerWidth: this.imageRect.width,
      outerHeight: this.imageRect.height,
    };
  }
}
