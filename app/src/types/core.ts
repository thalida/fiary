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
  fill_color: string;
  stroke_color: string;
  size: number;
  is_ruler_line: boolean;
  points: IElementPoint[];
  options: IElementOptions;
}

export interface IElementPoint {
  x: number;
  y: number;
}

export interface IElementOptions {
  [key: string]: any;
}

export interface IColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface IGradientStop {
  percent: number;
  color: IColor;
}

export type TGradient = IGradientStop[];
