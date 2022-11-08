import type { PALETTE_TYPES, PATTERN_TYPES } from "@/constants/core";

export type TPrimaryKey = string;

export interface IRooms {
  [key: string]: IRoom;
}

export interface IRoom {
  pk: TPrimaryKey;
  updatedAt: string;
  createdAt: string;
  bookshelfOrder: TPrimaryKey[];
}

export interface IBookshelves {
  [key: string]: IBookshelf;
}

export interface IBookshelf {
  pk: TPrimaryKey;
  updatedAt: string;
  createdAt: string;
  room: TPrimaryKey;
  notebookOrder: TPrimaryKey[];
}

export interface INotebooks {
  [key: string]: INotebook;
}

export interface INotebook {
  pk: TPrimaryKey;
  updatedAt: string;
  createdAt: string;
  bookshelf: TPrimaryKey;
  pageOrder: TPrimaryKey[];
  title: string | null | undefined;
}

export interface IPages {
  [key: string]: IPage;
}

export interface IPage {
  pk: TPrimaryKey;
  updatedAt: string;
  createdAt: string;
  notebook: TPrimaryKey;
  paperPalette: TPrimaryKey;
  paperSwatch: TPrimaryKey;
  patternPalette: TPrimaryKey;
  patternSwatch: TPrimaryKey;
  patternType: PATTERN_TYPES;
  patternOpacity: number;
  patternSize: number | null;
  patternSpacing: number | null;
}

export interface IPageOptions {
  fillPaletteId: TPrimaryKey | null;
  fillSwatchId: TPrimaryKey | null;
  strokePaletteId: TPrimaryKey | null;
  strokeSwatchId: TPrimaryKey | null;
}

export interface IElements {
  [key: string]: TElement;
}

export type TElement = ICanvasElement & IInteractiveElement & IClearElement;

export interface IElementBase {
  id: TPrimaryKey;
  pk?: TPrimaryKey;
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
  pk: TPrimaryKey;
  updatedAt: string;
  createdAt: string;
  title: string;
  isPublic: boolean;
  paletteType: PALETTE_TYPES;
  swatches: { [key: TPrimaryKey]: IPaletteSwatch };
  swatchOrder: TPrimaryKey[];
}

export interface IPaletteSwatch {
  pk: TPrimaryKey;
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
