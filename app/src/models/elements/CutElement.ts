import { ELEMENT_TYPE } from "@/constants/core";
import BaseCanvasElement from "@/models/BaseCanvasElement";
import type { IAPIElement, ICutElementSettings, IElement, TPrimaryKey } from "@/types/core";

export default class CutElement extends BaseCanvasElement {
  tool: ELEMENT_TYPE = ELEMENT_TYPE.CUT;
  declare settings: ICutElementSettings;

  constructor(
    element: IAPIElement | ({ pageUid: TPrimaryKey; tool: ELEMENT_TYPE } & Partial<IElement>),
    fromApi = false
  ) {
    element.settings = element.settings || {
      isCompletedCut: false,
    };

    super(element, fromApi);
  }
}
