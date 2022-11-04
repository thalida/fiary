import type { IElementPoint } from "@/types/core";
import BaseElement from "./BaseElement";

export default class BaseInteractiveElement extends BaseElement {
  style = {
    transform: {
      translate: [] as number[],
      scale: [] as number[],
      rotate: 0,
    },
    transformStr: "",
  };
  points: IElementPoint[] = [];
  isHTMLElement = true;
  isDeleted = false;

  setInteractiveElementTransform(
    initTransformMatrix: DOMMatrix,
    transformMatrix: DOMMatrix,
    transform = {}
  ) {
    const nextTransform = {
      ...this.style.transform,
      ...transform,
    };

    this.style.transform = nextTransform;
    this.style.transformStr = this.getInteractiveElementTransform(
      initTransformMatrix,
      transformMatrix
    );
    return nextTransform;
  }

  getInteractiveElementTransform(
    initTransformMatrix: DOMMatrix,
    transformMatrix: DOMMatrix
  ): string {
    const initMatrixA = initTransformMatrix ? initTransformMatrix.a : 1;
    const currMatrixA = transformMatrix ? transformMatrix.a : 1;
    const currMatrixE = transformMatrix ? transformMatrix.e : 0;
    const currMatrixF = transformMatrix ? transformMatrix.f : 0;
    const htmlRelativeZoom = currMatrixA / initMatrixA;
    const newOrigin = {
      x: currMatrixE / initMatrixA,
      y: currMatrixF / initMatrixA,
    };
    const translate = `translate(${
      newOrigin.x + this.style.transform.translate[0] * htmlRelativeZoom
    }px, ${newOrigin.y + this.style.transform.translate[1] * htmlRelativeZoom}px)`;
    const scale = `scale(${this.style.transform.scale[0] * htmlRelativeZoom}, ${
      this.style.transform.scale[1] * htmlRelativeZoom
    })`;
    const rotate = `rotate(${this.style.transform.rotate}deg)`;

    const transformStr = `${translate} ${scale} ${rotate}`;
    return transformStr;
  }
}
