import type { ICheckboxElementOptions } from "@/types/core";
import { ELEMENT_TYPE } from "@/constants/core";
import BaseInteractiveElement from "@/models/BaseInteractiveElement";

export default class CheckboxElement extends BaseInteractiveElement {
  tool = ELEMENT_TYPE.CHECKBOX;
  toolOptions: ICheckboxElementOptions = {
    isChecked: false,
  };
}
