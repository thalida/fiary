import type { PatternStyles } from "@/constants/core";

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
  bgColor: string | null | undefined;
  patternStyle: PatternStyles | null | undefined;
  patternColor: string | null | undefined;
  patternSize: number | null | undefined;
  patternSpacing: number | null | undefined;
}

export interface IElements {
  [key: string]: IElement;
}

export interface IElement {
  pk: TPrimaryKey;
  updatedAt: string;
  createdAt: string;
  page: TPrimaryKey;
  tool: number;
  fillColor: string;
  strokeColor: string;
  size: number;
  isRulerLine: boolean;
  points: IElementPoint[];
  options: IElementOptions;

  id: TPrimaryKey;
  isDeleted: boolean;
  isHTMLElement: boolean;
  isDrawingCached: boolean;
  isCompletedCut: boolean;
  composition: string;
  cache: any;
  toolOptions: any;
  dimensions: any;
  tmpFromStyle: any;
  style: any;
  freehandOptions: any;
  smoothPoints: any;
}

export interface IElementPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface IElementOptions {
  [key: string]: any;
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
