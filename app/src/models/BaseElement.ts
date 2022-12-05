import { v4 as uuidv4 } from "uuid";
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
  uid: TPrimaryKey;
  apiUid: TPrimaryKey | null = null;
  createdAt: string | null = null;
  updatedAt: string | null = null;
  pageUid: TPrimaryKey;
  tool: ELEMENT_TYPE;
  points: IElementPoint[] = [];
  settings: TElementSettings | null = null;
  transform: IElementTransform | null = null;
  dimensions: IElementDimensions | null = null;
  canvasSettings: ICanvasSettings | null = null;
  canvasDataUrl: string | null = null;
  isCached = false;
  isHtmlElement = false;
  isHidden = false;

  isDirty = true;

  cachedCanvasImage?: HTMLImageElement | null = null;

  constructor(
    element: IAPIElement | ({ pageUid: TPrimaryKey; tool: ELEMENT_TYPE } & Partial<IElement>),
    fromApi = false
  ) {
    const tmpUid = `tmp-${uuidv4()}-${Date.now()}`;
    this.uid = element.uid || tmpUid;
    this.pageUid = element.pageUid;
    this.tool = element.tool;

    if (fromApi) {
      this.updateFromApi(element as IAPIElement);
    } else {
      merge(this, element);
    }
  }

  updateFromApi(element: IAPIElement) {
    this.isDirty = false;

    this.apiUid = element.uid;
    this.createdAt = element.createdAt;
    this.updatedAt = element.updatedAt;
    this.pageUid = element.pageUid;
    this.tool = element.tool;
    this.points = element.points ? JSON.parse(element.points) : [];
    this.settings = element.settings ? JSON.parse(element.settings) : null;
    this.transform = element.transform ? JSON.parse(element.transform) : null;
    this.dimensions = element.dimensions ? JSON.parse(element.dimensions) : null;
    this.canvasSettings = element.canvasSettings ? JSON.parse(element.canvasSettings) : null;
    this.canvasDataUrl = element.canvasDataUrl;
    this.isCached = element.isCached;
    this.isHtmlElement = element.isHtmlElement;
    this.isHidden = element.isHidden;

    if (this.canvasDataUrl) {
      const image = new Image();
      image.onload = () => {
        this.cachedCanvasImage = image;
      };
      image.src = this.canvasDataUrl;
    }
  }

  toBatchApiFormat() {
    const element = {
      uid: null as TPrimaryKey | null,
      page_uid: this.pageUid,
      tool: this.tool,
      points: this.points,
      settings: this.settings,
      transform: this.transform,
      dimensions: this.dimensions,
      canvas_settings: this.canvasSettings,
      canvas_data_url: this.canvasDataUrl,
      is_cached: this.isCached,
      is_html_element: this.isHtmlElement,
      is_hidden: this.isHidden,
    };

    if (this.apiUid) {
      element.uid = this.apiUid;
    }

    return JSON.stringify(element);
  }
}
