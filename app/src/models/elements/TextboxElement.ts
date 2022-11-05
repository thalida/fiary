import type { ITextboxElementOptions } from "@/types/core";
import { CanvasTool } from "@/constants/core";
import BaseInteractiveElement from "@/models/BaseInteractiveElement";

export default class TextboxElement extends BaseInteractiveElement {
  tool = CanvasTool.TEXTBOX;
  toolOptions: ITextboxElementOptions = {
    textContents: null,
  };
}
