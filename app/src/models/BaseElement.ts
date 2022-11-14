import type { ELEMENT_TYPE } from "@/constants/core";
import type {
  IAPIElement,
  ICanvasSettings,
  IElement,
  IElementDimensions,
  IElementPoint,
  IElementTransform,
  TElementSettings,
  TPrimaryKey,
} from "@/types/core";
import { merge } from "lodash";

export default class BaseElement {
  uid: TPrimaryKey | null = null;
  createdAt: string | null = null;
  updatedAt: string | null = null;
  pageUid: TPrimaryKey;
  tool: ELEMENT_TYPE;
  points: IElementPoint[] = [];
  settings: TElementSettings | null = null;
  transform: IElementTransform | null = null;
  dimensions: IElementDimensions | null = null;
  canvasSettings: ICanvasSettings | null = null;
  imageRender: string | null = null;
  loadedImage: HTMLImageElement | null = null;
  isCached = false;
  isHtmlElement = false;
  isHidden = false;

  transformStr?: string | null;

  constructor(element: { pageUid: TPrimaryKey; tool: ELEMENT_TYPE } & Partial<IElement>) {
    this.pageUid = element.pageUid;
    this.tool = element.tool;
    merge(this, element);
  }
}
