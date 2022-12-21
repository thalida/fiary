import type {
  ELEMENT_TYPE,
  LineEndSide,
  LineEndStyle,
  PALETTE_TYPES,
  PATTERN_TYPES,
} from "@/constants/core";

export type TPrimaryKey = string;

export interface IRooms {
  [key: string]: IRoom;
}

export interface IRoom {
  uid: TPrimaryKey;
  updatedAt: string;
  createdAt: string;
  bookshelfOrder: TPrimaryKey[];
}

export interface IBookshelves {
  [key: string]: IBookshelf;
}

export interface IBookshelf {
  uid: TPrimaryKey;
  updatedAt: string;
  createdAt: string;
  roomUid: TPrimaryKey;
  notebookOrder: TPrimaryKey[];
}

export interface INotebooks {
  [key: string]: INotebook;
}

export interface INotebook {
  uid: TPrimaryKey;
  updatedAt: string;
  createdAt: string;
  bookshelfUid: TPrimaryKey;
  pageOrder: TPrimaryKey[];
  title: string | null | undefined;
}

export interface IPages {
  [key: string]: IPage;
}

export interface IPage {
  uid: TPrimaryKey;
  updatedAt: string;
  createdAt: string;
  notebookUid: TPrimaryKey;
  elementOrder: TPrimaryKey[];
  canvasDataUrl: string | null;

  paperPaletteUid: TPrimaryKey;
  paperSwatchUid: TPrimaryKey;
  patternPaletteUid: TPrimaryKey;
  patternSwatchUid: TPrimaryKey;
  patternType: PATTERN_TYPES;
  patternOptions: { [key: string]: { [key: string]: any } };
  fillPaletteUid: TPrimaryKey | null;
  fillSwatchUid: TPrimaryKey | null;
  strokePaletteUid: TPrimaryKey | null;
  strokeSwatchUid: TPrimaryKey | null;
  selectedTool: number;
  selectedToolSize: number;
  selectedLineEndStyle: LineEndStyle;
  selectedLineEndSide: LineEndSide;
  isDebugMode: boolean;
  isPasteMode: boolean;
  isAddImageMode: boolean;
  isInteractiveEditMode: boolean;
  isTextboxEditMode: boolean;
  isRulerMode: boolean;

  allowFingerDrawing: boolean;
  transformMatrix: ITransformMatrix;
  isMovingRuler: boolean;
  isDrawing: boolean;
  isSwatchOpen: boolean;
  isStylus: boolean;
  detectedStylus: boolean;
  canvasImage?: HTMLImageElement | null;
}

export interface ITransformMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface IElements {
  [key: string]: IElement;
}

export interface IElement {
  uid: TPrimaryKey | null;
  createdAt: string | null;
  updatedAt: string | null;
  pageUid: TPrimaryKey;
  tool: ELEMENT_TYPE;
  points: IElementPoint[];
  settings: TElementSettings | null;
  transform: IElementTransform | null;
  dimensions: IElementDimensions | null;
  canvasSettings: ICanvasSettings | null;
  canvasDataUrl: string | null;
  isCached: boolean;
  isHtmlElement: boolean;
  isHidden: boolean;

  cachedCanvasImage?: HTMLImageElement | null;
  focusOnMount?: boolean;
}

export interface IAPIElement {
  uid: TPrimaryKey;
  pageUid: TPrimaryKey;
  createdAt: string;
  updatedAt: string;
  tool: number;
  points: string;
  settings: string | null;
  transform: string | null;
  dimensions: string | null;
  canvasSettings: string | null;
  canvasDataUrl: string | null;
  isCached: boolean;
  isHtmlElement: boolean;
  isHidden: boolean;
}

export interface ICanvasSettings {
  dpi: number;
  composition: string;
  opacity: number;
  fillColor: TColor | undefined | null;
  strokeColor: TColor | undefined | null;
  smoothPoints: any;
  freehandOptions: { [key: string]: any };
  lineSize: number | null;
  isRulerLine: boolean | null;
}

export interface IElementDimensions {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  outerMinX: number;
  outerMinY: number;
  outerMaxX: number;
  outerMaxY: number;
  width: number;
  height: number;
  outerWidth: number;
  outerHeight: number;
  lineLength: number | null;
}

export interface IElementTransform {
  translate: number[];
  scale: number[];
  rotate: number;
}

export type TElementSettings =
  | ILineElementSettings
  | IImageElementSettings
  | ICheckboxElementSettings
  | ITextboxElementSettings
  | ICutElementSettings
  | IPasteElementSettings;

export interface ILineElementSettings {
  lineEndStyle: number;
  lineEndSide: number;
}

export interface IImageElementSettings {
  image: any;
  imageRect: { left: number; top: number; width: number; height: number };
}

export interface ICheckboxElementSettings {
  isChecked: boolean;
}

export interface ITextboxElementSettings {
  textContents: string | null;
}

export interface ICutElementSettings {
  isCompletedCut: boolean | null;
}

export interface IPasteElementSettings {
  cutRect: { left: number; top: number; width: number; height: number };
}

export interface IElementPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface IPalettes {
  [key: TPrimaryKey]: IPalette;
}

export interface IPalette {
  uid: TPrimaryKey;
  updatedAt: string;
  createdAt: string;
  title: string;
  isPublic: boolean;
  paletteType: PALETTE_TYPES;
  swatches: { [key: TPrimaryKey]: IPaletteSwatch };
  swatchOrder: TPrimaryKey[];
}

export interface IPaletteSwatch {
  uid: TPrimaryKey;
  swatch: TColor;
  isDefault: boolean;
}

export interface ISolidColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface IGradientStop {
  percent: number;
  color: ISolidColor;
}

export type TGradient = IGradientStop[];
export type TColor = ISolidColor | TGradient;
