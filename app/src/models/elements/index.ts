import BlobElement from "./BlobElement";
import CheckboxElement from "./CheckboxElement";
import CircleElement from "./CircleElement";
import ClearAllElement from "./ClearAllElement";
import CutElement from "./CutElement";
import EraserElement from "./EraserElement";
import HighlighterElement from "./HighlighterElement";
import ImageElement from "./ImageElement";
import LineElement from "./LineElement";
import MarkerElement from "./MarkerElement";
import PasteElement from "./PasteElement";
import PenElement from "./PenElement";
import RectangleElement from "./RectangleElement";
import TextboxElement from "./TextboxElement";
import TriangleElement from "./TriangleElement";
import { ELEMENT_TYPE } from "@/constants/core";

export const ELEMENT_MAP = {
  [ELEMENT_TYPE.BLOB]: BlobElement,
  [ELEMENT_TYPE.CHECKBOX]: CheckboxElement,
  [ELEMENT_TYPE.CIRCLE]: CircleElement,
  [ELEMENT_TYPE.CLEAR_ALL]: ClearAllElement,
  [ELEMENT_TYPE.CUT]: CutElement,
  [ELEMENT_TYPE.ERASER]: EraserElement,
  [ELEMENT_TYPE.HIGHLIGHTER]: HighlighterElement,
  [ELEMENT_TYPE.IMAGE]: ImageElement,
  [ELEMENT_TYPE.LINE]: LineElement,
  [ELEMENT_TYPE.MARKER]: MarkerElement,
  [ELEMENT_TYPE.PASTE]: PasteElement,
  [ELEMENT_TYPE.PEN]: PenElement,
  [ELEMENT_TYPE.RECTANGLE]: RectangleElement,
  [ELEMENT_TYPE.TEXTBOX]: TextboxElement,
  [ELEMENT_TYPE.TRIANGLE]: TriangleElement,
};
