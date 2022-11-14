import type { ITextboxElementSettings } from "@/types/core";
import { ELEMENT_TYPE } from "@/constants/core";
import BaseInteractiveElement from "@/models/BaseInteractiveElement";

export default class TextboxElement extends BaseInteractiveElement {
  tool = ELEMENT_TYPE.TEXTBOX;
  settings: ITextboxElementSettings = {
    textContents: null,
  };
}
