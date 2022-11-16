import { ELEMENT_TYPE, LineEndSide, LineEndStyle } from "@/constants/core";
import BaseCanvasElement from "@/models/BaseCanvasElement";
import type { IAPIElement, IElement, ILineElementSettings, TPrimaryKey } from "@/types/core";

export default class LineElement extends BaseCanvasElement {
  tool = ELEMENT_TYPE.LINE;
  declare settings: ILineElementSettings;

  constructor(
    element: IAPIElement | ({ pageUid: TPrimaryKey; tool: ELEMENT_TYPE } & Partial<IElement>),
    fromApi = false
  ) {
    element.settings = element.settings || {
      lineEndSide: LineEndSide.NONE,
      lineEndStyle: LineEndStyle.NONE,
    };

    super(element, fromApi);
    this.points = this.calculateLinePoints(this.points[0]);
  }
}
