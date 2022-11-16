import type { IElementTransform } from "@/types/core";
import BaseElement from "./BaseElement";

export default class BaseInteractiveElement extends BaseElement {
  isHtmlElement = true;
  declare transform: IElementTransform;
  tmpFromTransfrom: IElementTransform | null = null;
}
