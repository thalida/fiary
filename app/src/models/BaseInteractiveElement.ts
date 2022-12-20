import type { IElementTransform } from "@/types/core";
import BaseElement from "./BaseElement";

export default class BaseInteractiveElement extends BaseElement {
  isHtmlElement = true;
  declare transform: IElementTransform;
  tmpFromTransfrom: IElementTransform | null = null;

  getTransformCSS(): string {
    const translate = `translate(${this.transform.translate[0]}px, ${this.transform.translate[1]}px)`;
    const scale = `scale(${this.transform.scale[0]}, ${this.transform.scale[1]})`;
    const rotate = `rotate(${this.transform.rotate}deg)`;

    return `${translate} ${scale} ${rotate}`;
  }
}
