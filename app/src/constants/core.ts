export enum PageHistoryEvent {
  ADD_CANVAS_ELEMENT = 1,
  REMOVE_CANVAS_ELEMENT = 2,
  UPDATE_CANVAS_ELEMENT_STYLES = 3,
  UPDATE_CANVAS_ELEMENT_OPTIONS = 4,
  ADD_IMAGE_START = 10,
  UPDATE_IMAGE_STYLES = 11,
}

export enum ELEMENT_TYPE {
  ERASER = 1,
  CLEAR_ALL = 2,
  PEN = 10,
  MARKER = 11,
  HIGHLIGHTER = 12,
  BLOB = 20,
  CIRCLE = 30,
  RECTANGLE = 31,
  TRIANGLE = 32,
  LINE = 33,
  CUT = 40,
  PASTE = 41,
  IMAGE = 50,
  CHECKBOX = 60,
  TEXTBOX = 61,
}

export const CANVAS_POINTER_TOOL = 0;
export const CANVAS_PAPER_TOOL = 0.1;

export const CANVAS_TOOL_CHOICES = [
  { key: CANVAS_POINTER_TOOL, label: "Pointer" },
  { key: CANVAS_PAPER_TOOL, label: "Paper" },
  { key: ELEMENT_TYPE.PEN, label: "Pen" },
  { key: ELEMENT_TYPE.MARKER, label: "Marker" },
  { key: ELEMENT_TYPE.HIGHLIGHTER, label: "Highlighter" },
  { key: ELEMENT_TYPE.BLOB, label: "Blob" },
  { key: ELEMENT_TYPE.CIRCLE, label: "Circle" },
  { key: ELEMENT_TYPE.RECTANGLE, label: "Rectangle" },
  { key: ELEMENT_TYPE.TRIANGLE, label: "Triangle" },
  { key: ELEMENT_TYPE.LINE, label: "Line" },
  { key: ELEMENT_TYPE.IMAGE, label: "Image" },
  { key: ELEMENT_TYPE.CHECKBOX, label: "Checkbox" },
  { key: ELEMENT_TYPE.TEXTBOX, label: "Textbox" },
  { key: ELEMENT_TYPE.CUT, label: "Cut" },
  { key: ELEMENT_TYPE.ERASER, label: "Eraser" },
  { key: ELEMENT_TYPE.CLEAR_ALL, label: "Clear All" },
];

export const CANVAS_LINE_TOOLS = [ELEMENT_TYPE.PEN, ELEMENT_TYPE.MARKER, ELEMENT_TYPE.HIGHLIGHTER];
export const CANVAS_INTERACTIVE_TOOLS = [ELEMENT_TYPE.CHECKBOX, ELEMENT_TYPE.TEXTBOX];
export const CANVAS_NONDRAWING_TOOLS = [
  ELEMENT_TYPE.CLEAR_ALL,
  CANVAS_POINTER_TOOL,
  CANVAS_PAPER_TOOL,
];
export const CANVAS_PAPER_TOOLS = [CANVAS_PAPER_TOOL];

export enum LineEndSide {
  NONE = 0,
  ONE = 1,
  BOTH = 2,
}
export const LINE_END_SIDE_CHOICES = [
  { key: LineEndSide.NONE, label: "None" },
  { key: LineEndSide.ONE, label: "One Side" },
  { key: LineEndSide.BOTH, label: "Both Sides" },
];

export enum LineEndStyle {
  NONE = 0,
  ARROW = 1,
  CIRCLE = 2,
  SQUARE = 3,
}
export const LINE_END_STYLE_CHOICES = [
  { key: LineEndStyle.NONE, label: "None" },
  { key: LineEndStyle.ARROW, label: "Arrow" },
  { key: LineEndStyle.CIRCLE, label: "Circle" },
  { key: LineEndStyle.SQUARE, label: "Square" },
];

export const PEN_SIZES = [5, 10, 20, 40, 60];
export const DEFAULT_PEN_SIZE = 20;
export const MAX_SWATCH_COLORS = 9;
export const TRANSPARENT_COLOR = { r: 0, g: 0, b: 0, a: 0 };
export const DEFAULT_PATTERN_OPACITY = 50;

export enum PALETTE_TYPES {
  GENERAL = 1,
  PAPER = 10,
  PATTERN = 20,
  TOOL_FILL = 31,
  TOOL_STROKE = 32,
}

export enum SWATCH_DEFAULT_USAGES {
  PAPER = 1,
  PATTERN = 10,
  TOOL = 20,
}

export enum PATTERN_TYPES {
  SOLID = 1,
  DOTS = 2,
  SQUARES = 3,
  LINES = 4,
  ISOMETRIC = 5,
}

export const DEFAULT_PATTERN_TYPE = PATTERN_TYPES.SOLID;
