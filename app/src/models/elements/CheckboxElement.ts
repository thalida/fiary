import type { IAPIElement, ICheckboxElementSettings, IElement, TPrimaryKey } from "@/types/core";
import { ELEMENT_TYPE } from "@/constants/core";
import BaseInteractiveElement from "@/models/BaseInteractiveElement";

export default class CheckboxElement extends BaseInteractiveElement {
  tool = ELEMENT_TYPE.CHECKBOX;
  declare settings: ICheckboxElementSettings;

  constructor(
    element: IAPIElement | ({ pageUid: TPrimaryKey; tool: ELEMENT_TYPE } & Partial<IElement>),
    fromApi = false
  ) {
    element.settings = element.settings || {
      isChecked: false,
    };

    super(element, fromApi);
  }
}
