import type { IElementPoint } from "@/types/core";
import { v4 as uuidv4 } from "uuid";

export default class BaseElement {
  uid: string = uuidv4();
  isDeleted = false;
  isHTMLElement = false;
  points: IElementPoint[] = [];
}
