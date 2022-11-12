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
  paperPaletteUid: TPrimaryKey;
  paperSwatchUid: TPrimaryKey;
  patternPaletteUid: TPrimaryKey;
  patternSwatchUid: TPrimaryKey;
  patternType: PATTERN_TYPES;
  patternOpacity: number;
  patternSize: number | null;
  patternSpacing: number | null;
  elementOrder: TPrimaryKey[];
}

export interface IPageOptions {
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
  isPanning: boolean;
  isMovingRuler: boolean;
  isDrawing: boolean;
  isSwatchOpen: boolean;
  isStylus: boolean;
  detectedStylus: boolean;
  allowFingerDrawing: boolean;

  initTransformMatrix: ITransformMatrix;
  transformMatrix: ITransformMatrix;
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
  uid: TPrimaryKey;
  pageUid: TPrimaryKey;
  createdAt: string;
  updatedAt: string;
  tool: ELEMENT_TYPE;
  points: IElementPoint[];
  settings: TElementSettings;
  transform: IElementTransform;
  dimensions: IElementDimensions;
  canvasSettings: ICanvasSettings;
  imageRender: string | null;
  isCached: boolean;
  isHTMLElement: boolean;
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
  translate: [number, number];
  rotate: [number, number];
  scale: [number, number];
}

export type TElementSettings =
  | ILineElementSettings
  | IImageElementSettings
  | ICheckboxElementSettings
  | ITextboxElementSettings
  | ICutElementSettings;

export interface ILineElementSettings {
  lineEndStyle: number;
  lineEndSide: number;
}

export interface IImageElementSettings {
  image: any;
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
