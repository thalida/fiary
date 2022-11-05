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
import { CanvasTool } from "@/constants/core";

export const ELEMENT_MAP = {
  [CanvasTool.BLOB]: BlobElement,
  [CanvasTool.CHECKBOX]: CheckboxElement,
  [CanvasTool.CIRCLE]: CircleElement,
  [CanvasTool.CLEAR_ALL]: ClearAllElement,
  [CanvasTool.CUT]: CutElement,
  [CanvasTool.ERASER]: EraserElement,
  [CanvasTool.HIGHLIGHTER]: HighlighterElement,
  [CanvasTool.IMAGE]: ImageElement,
  [CanvasTool.LINE]: LineElement,
  [CanvasTool.MARKER]: MarkerElement,
  [CanvasTool.PASTE]: PasteElement,
  [CanvasTool.PEN]: PenElement,
  [CanvasTool.RECTANGLE]: RectangleElement,
  [CanvasTool.TEXTBOX]: TextboxElement,
  [CanvasTool.TRIANGLE]: TriangleElement,
};
