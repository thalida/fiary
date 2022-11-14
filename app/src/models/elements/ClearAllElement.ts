import { ELEMENT_TYPE } from "@/constants/core";
import BaseCanvasElement from "@/models/BaseCanvasElement";

export default class ClearAllElement extends BaseCanvasElement {
  tool = ELEMENT_TYPE.CLEAR_ALL;
}
