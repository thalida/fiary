import type { ITextboxElementOptions } from "@/types/core";
import { CanvasTool } from "@/constants/core";
import BaseInteractiveElement from "./BaseInteractiveElement";

export default class TextboxElement extends BaseInteractiveElement {
  tool = CanvasTool.TEXTBOX;
  toolOptions: ITextboxElementOptions = {
    textContents: null,
  };
}
