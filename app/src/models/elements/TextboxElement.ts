import type { ITextboxElementOptions } from "@/types/core";
import { ELEMENT_TYPE } from "@/constants/core";
import BaseInteractiveElement from "@/models/BaseInteractiveElement";

export default class TextboxElement extends BaseInteractiveElement {
  tool = ELEMENT_TYPE.TEXTBOX;
  toolOptions: ITextboxElementOptions = {
    textContents: null,
  };
}
