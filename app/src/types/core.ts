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

  elements: { [key: TPrimaryKey]: any };
  elementOrder: TPrimaryKey[];
  clearAllElementIndexes: number[];
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

  history: any[];
  historyIndex: number;

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

export type TElement = ICanvasElement & IInteractiveElement & IClearElement;

export interface IElement {
  uid: TPrimaryKey;
  pageUid: TPrimaryKey;
  createdAt: string;
  updatedAt: string;
  tool: ELEMENT_TYPE;
  render: any;
  options: any;
}

export interface IElementBase {
  id: TPrimaryKey;
  uid: TPrimaryKey;
  updatedAt?: string;
  createdAt?: string;
  page?: TPrimaryKey;
  tool: number;
  points: IElementPoint[];
  toolOptions: TElementOptions | null;
  isDeleted: boolean;
  isHTMLElement: boolean;
}

export interface ICanvasElement extends IElementBase {
  fillColor: TColor;
  strokeColor: TColor;
  opacity: number;
  size: number;
  isRulerLine: boolean;
  cache: any;
  isDrawingCached: boolean;
  composition: string;
  dimensions: any;
  freehandOptions: any;
  smoothPoints: any;
  isCompletedCut?: boolean;
}

export interface IClearElement extends IElementBase {
  fillColor: TColor;
  strokeColor: TColor;
  cache: any;
  isDrawingCached: boolean;
  composition: string;
  dimensions: any;
}
export interface IInteractiveElement extends IElementBase {
  style: any;
  tmpFromStyle?: any;
}

export interface IElementPoint {
  x: number;
  y: number;
  pressure?: number;
}

export type TElementOptions =
  | ILineElementOptions
  | IImageElementOptions
  | ICheckboxElementOptions
  | ITextboxElementOptions;

export interface ILineElementOptions {
  lineEndStyle: number;
  lineEndSide: number;
}

export interface IImageElementOptions {
  image: any;
}

export interface ICheckboxElementOptions {
  isChecked: boolean;
}

export interface ITextboxElementOptions {
  textContents: string | null;
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
