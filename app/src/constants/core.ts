export enum PageHistoryEvent {
  ADD_CANVAS_ELEMENT = 1,
  REMOVE_CANVAS_ELEMENT = 2,
  UPDATE_CANVAS_ELEMENT_STYLES = 3,
  UPDATE_CANVAS_ELEMENT_OPTIONS = 4,
  ADD_IMAGE_START = 10,
  UPDATE_IMAGE_STYLES = 11,
}

export enum CanvasTool {
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

export const CANVAS_TOOL_CHOICES = [
  { key: CanvasTool.POINTER, label: "Pointer" },
  { key: CanvasTool.PAPER, label: "Paper" },
  { key: CanvasTool.PEN, label: "Pen" },
  { key: CanvasTool.MARKER, label: "Marker" },
  { key: CanvasTool.HIGHLIGHTER, label: "Highlighter" },
  { key: CanvasTool.BLOB, label: "Blob" },
  { key: CanvasTool.CIRCLE, label: "Circle" },
  { key: CanvasTool.RECTANGLE, label: "Rectangle" },
  { key: CanvasTool.TRIANGLE, label: "Triangle" },
  { key: CanvasTool.LINE, label: "Line" },
  { key: CanvasTool.IMAGE, label: "Image" },
  { key: CanvasTool.CHECKBOX, label: "Checkbox" },
  { key: CanvasTool.TEXTBOX, label: "Textbox" },
  { key: CanvasTool.CUT, label: "Cut" },
  { key: CanvasTool.ERASER, label: "Eraser" },
  { key: CanvasTool.CLEAR_ALL, label: "Clear All" },
];

export const CANVAS_LINE_TOOLS = [CanvasTool.PEN, CanvasTool.MARKER, CanvasTool.HIGHLIGHTER];
export const CANVAS_PAPER_TOOLS = [CanvasTool.PAPER];
export const CANVAS_INTERACTIVE_TOOLS = [CanvasTool.CHECKBOX, CanvasTool.TEXTBOX];
export const CANVAS_NONDRAWING_TOOLS = [CanvasTool.PAPER, CanvasTool.POINTER, CanvasTool.CLEAR_ALL];

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
export const DEFAULT_ELEMENT_FILLCOLOR_INDEX = 0;
export const DEFAULT_PAPER_COLOR_INDEX = 0;
export const DEFAULT_PATTERN_COLOR_INDEX = 3;
export const DEFAULT_PATTERN_OPACITY = 50;

export enum PatternStyles {
  SOLID = 1,
  DOTS = 2,
  SQUARES = 3,
  LINES = 4,
  ISOMETRIC = 5,
}
