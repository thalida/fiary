import type { IAPIElement, IElement, ITextboxElementSettings, TPrimaryKey } from "@/types/core";
import { ELEMENT_TYPE } from "@/constants/core";
import BaseInteractiveElement from "@/models/BaseInteractiveElement";

export default class TextboxElement extends BaseInteractiveElement {
  tool = ELEMENT_TYPE.TEXTBOX;
  declare settings: ITextboxElementSettings;
  declare focusOnMount: boolean;

  constructor(
    element: IAPIElement | ({ pageUid: TPrimaryKey; tool: ELEMENT_TYPE } & Partial<IElement>),
    fromApi = false
  ) {
    element.settings = element.settings || {
      textContents: null,
    };
    (element as IElement).focusOnMount = (element as IElement).focusOnMount || false;

    super(element, fromApi);
  }
}
