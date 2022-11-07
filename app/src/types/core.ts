import type { PATTERN_TYPES } from "@/constants/core";

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
  paperColor: TColor;
  patternType: PATTERN_TYPES;
  patternColor: TColor;
  patternOpacity: number;
  patternSize: number | null;
  patternSpacing: number | null;
  fillColor: TColor;
  strokeColor: TColor;
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

export interface IColorSwatches {
  [key: string]: TColorSwatch;
}

export type TColorSwatch = TColor[];

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
