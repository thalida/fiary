import type { ICheckboxElementOptions } from "@/types/core";
import { CanvasTool } from "@/constants/core";
import BaseInteractiveElement from "@/models/BaseInteractiveElement";

export default class CheckboxElement extends BaseInteractiveElement {
  tool = CanvasTool.CHECKBOX;
  toolOptions: ICheckboxElementOptions = {
    isChecked: false,
  };
}
