import type { ELEMENT_TYPE } from "@/constants/core";
import type {
  IElement,
  IElementPoint,
  IElementTransform,
  ITransformMatrix,
  TPrimaryKey,
} from "@/types/core";
import BaseElement from "./BaseElement";

export default class BaseInteractiveElement extends BaseElement {
  #initMatrix: ITransformMatrix;
  transform: IElementTransform;
  tmpFromTransfrom: IElementTransform | null = null;

  constructor(
    element: { pageUid: TPrimaryKey; tool: ELEMENT_TYPE } & Partial<IElement>,
    {
      pos,
      initMatrix,
      matrix,
    }: {
      pos: IElementPoint;
      initMatrix: { a: number; b: number; c: number; d: number; e: number; f: number };
      matrix: { a: number; b: number; c: number; d: number; e: number; f: number };
    }
  ) {
    super(element);
    this.isHtmlElement = true;
    this.points = [pos];
    this.transform = {
      translate: [pos.x, pos.y],
      scale: [1, 1],
      rotate: 0,
    };

    this.#initMatrix = initMatrix;

    this.setTransform(matrix);
  }

  setTransform(
    transformMatrix: { a: number; b: number; c: number; d: number; e: number; f: number },
    newTransform = {}
  ) {
    const transform = {
      ...this.transform,
      ...newTransform,
    };

    this.transform = transform;
    this.transformStr = this.getRelativeTransformStr(transformMatrix);
    return transform;
  }

  getRelativeTransformStr(transformMatrix: ITransformMatrix): string {
    const initMatrixA = this.#initMatrix.a;
    const currMatrixA = transformMatrix.a;
    const currMatrixE = transformMatrix.e;
    const currMatrixF = transformMatrix.f;
    const htmlRelativeZoom = currMatrixA / initMatrixA;
    const newOrigin = {
      x: currMatrixE / initMatrixA,
      y: currMatrixF / initMatrixA,
    };
    const translate = `translate(${
      newOrigin.x + this.transform.translate[0] * htmlRelativeZoom
    }px, ${newOrigin.y + this.transform.translate[1] * htmlRelativeZoom}px)`;
    const scale = `scale(${this.transform.scale[0] * htmlRelativeZoom}, ${
      this.transform.scale[1] * htmlRelativeZoom
    })`;
    const rotate = `rotate(${this.transform.rotate}deg)`;

    const transformStr = `${translate} ${scale} ${rotate}`;
    return transformStr;
  }
}
