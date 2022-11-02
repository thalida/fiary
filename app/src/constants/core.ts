export enum PageHistoryEvent {
  ADD_CANVAS_ELEMENT = 1,
  REMOVE_CANVAS_ELEMENT = 2,
  UPDATE_CANVAS_ELEMENT_STYLES = 3,
  UPDATE_CANVAS_ELEMENT_OPTIONS = 4,
  ADD_IMAGE_START = 10,
  UPDATE_IMAGE_STYLES = 11,
}

export enum ElementTool {
  POINTER = 0,
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
  PAPER = 70,
}

export const ELEMENT_TOOL_CHOICES = [
  { key: ElementTool.POINTER, label: "Pointer" },
  { key: ElementTool.PAPER, label: "Paper" },
  { key: ElementTool.PEN, label: "Pen" },
  { key: ElementTool.MARKER, label: "Marker" },
  { key: ElementTool.HIGHLIGHTER, label: "Highlighter" },
  { key: ElementTool.BLOB, label: "Blob" },
  { key: ElementTool.CIRCLE, label: "Circle" },
  { key: ElementTool.RECTANGLE, label: "Rectangle" },
  { key: ElementTool.TRIANGLE, label: "Triangle" },
  { key: ElementTool.LINE, label: "Line" },
  { key: ElementTool.IMAGE, label: "Image" },
  { key: ElementTool.CHECKBOX, label: "Checkbox" },
  { key: ElementTool.TEXTBOX, label: "Textbox" },
  { key: ElementTool.CUT, label: "Cut" },
  { key: ElementTool.ERASER, label: "Eraser" },
  { key: ElementTool.CLEAR_ALL, label: "Clear All" },
];

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
export const DEFAULT_PEN_SIZE = 40;

export const MAX_SWATCH_COLORS = 9;
export const TRANSPARENT_COLOR = { r: 0, g: 0, b: 0, a: 0 };
export const SPECIAL_TOOL_SWATCH_KEY = "special-tool-swatch";
export const SPECIAL_PAPER_SWATCH_KEY = "special-paper-swatch";
export const DEFAULT_SWATCH_KEY = "default";
export const DEFAULT_COLOR_SWATCHES = {
  [SPECIAL_TOOL_SWATCH_KEY]: [TRANSPARENT_COLOR],
  [SPECIAL_PAPER_SWATCH_KEY]: [
    { r: 255, g: 255, b: 255, a: 1 },
    { r: 0, g: 0, b: 0, a: 1 },
    { r: 255, g: 250, b: 232, a: 1 },
    { r: 127, g: 127, b: 127, a: 1 },
  ],
  [DEFAULT_SWATCH_KEY]: [
    { r: 0, g: 0, b: 0, a: 1 },
    { r: 255, g: 0, b: 0, a: 1 },
    { r: 0, g: 255, b: 0, a: 1 },
    { r: 0, g: 0, b: 255, a: 1 },
    { r: 255, g: 255, b: 0, a: 1 },
    { r: 0, g: 255, b: 255, a: 1 },
    { r: 255, g: 0, b: 255, a: 1 },
    [
      {
        percent: 0,
        color: { r: 255, g: 0, b: 0, a: 1 },
      },
      {
        percent: 100,
        color: { r: 0, g: 0, b: 255, a: 1 },
      },
    ],
    [
      {
        percent: 0,
        color: { r: 0, g: 255, b: 0, a: 1 },
      },
      {
        percent: 100,
        color: { r: 0, g: 0, b: 255, a: 1 },
      },
    ],
  ],
};
