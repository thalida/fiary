import { ELEMENT_TYPE } from "@/constants/core";
import type { IImageElementSettings } from "@/types/core";
import BaseCanvasElement from "@/models/BaseCanvasElement";

export default class ImageElement extends BaseCanvasElement {
  tool = ELEMENT_TYPE.IMAGE;
  declare settings: IImageElementSettings;

  calculateDimensions() {
    return {
      minX: this.settings.imageRect.left,
      minY: this.settings.imageRect.top,
      maxX: this.settings.imageRect.left + this.settings.imageRect.width,
      maxY: this.settings.imageRect.top + this.settings.imageRect.height,
      outerMaxX: this.settings.imageRect.left + this.settings.imageRect.width,
      outerMaxY: this.settings.imageRect.top + this.settings.imageRect.height,
      width: this.settings.imageRect.width,
      height: this.settings.imageRect.height,
      lineLength: null,
      outerMinX: this.settings.imageRect.left,
      outerMinY: this.settings.imageRect.top,
      outerWidth: this.settings.imageRect.width,
      outerHeight: this.settings.imageRect.height,
    };
  }
}
