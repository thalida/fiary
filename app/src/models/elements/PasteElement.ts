import { ELEMENT_TYPE } from "@/constants/core";
import type { IPasteElementSettings } from "@/types/core";
import BaseCanvasElement from "@/models/BaseCanvasElement";

export default class PasteElement extends BaseCanvasElement {
  tool = ELEMENT_TYPE.PASTE;
  declare settings: IPasteElementSettings;

  calculateDimensions() {
    return {
      minX: this.settings.cutRect.left,
      minY: this.settings.cutRect.top,
      maxX: this.settings.cutRect.left + this.settings.cutRect.width,
      maxY: this.settings.cutRect.top + this.settings.cutRect.height,
      outerMaxX: this.settings.cutRect.left + this.settings.cutRect.width,
      outerMaxY: this.settings.cutRect.top + this.settings.cutRect.height,
      width: this.settings.cutRect.width,
      height: this.settings.cutRect.height,
      lineLength: null,
      outerMinX: this.settings.cutRect.left,
      outerMinY: this.settings.cutRect.top,
      outerWidth: this.settings.cutRect.width,
      outerHeight: this.settings.cutRect.height,
    };
  }
}
