import type { ICheckboxElementSettings } from "@/types/core";
import { ELEMENT_TYPE } from "@/constants/core";
import BaseInteractiveElement from "@/models/BaseInteractiveElement";

export default class CheckboxElement extends BaseInteractiveElement {
  tool = ELEMENT_TYPE.CHECKBOX;
  settings: ICheckboxElementSettings = {
    isChecked: false,
  };
}
