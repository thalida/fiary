import type { PatternStyles } from "@/constants/core";
import type { ComputedRef, Ref } from "vue";

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

export interface ICanvasStore {
  elements: Ref<IElements>;
  elementOrder: Ref<TPrimaryKey[]>;
  clearAllElementIndexes: Ref<number[]>;
  activeElementStartIdx: Ref<ComputedRef<number>>;
  activeElements: ComputedRef<TPrimaryKey[]>;
  activeHTMLElements: ComputedRef<TPrimaryKey[]>;
  lastActiveElement: ComputedRef<TPrimaryKey | null>;
  elementById: Ref<(id: TPrimaryKey) => TElement>;
  ruler: Ref<ICanvasRulerStore>;
  pasteTransform: Ref<ICanvasPasteTransformStore>;
  imageTransform: Ref<ICanvasImageTransformStore>;
  debugMode: Ref<boolean>;
  isPasteMode: Ref<boolean>;
  isAddImageMode: Ref<boolean>;
  isInteractiveEditMode: Ref<boolean>;
  isTextboxEditMode: Ref<boolean>;
  isPanning: Ref<boolean>;
  isMovingRuler: Ref<boolean>;
  isDrawing: Ref<boolean>;
  isStylus: Ref<boolean>;
  detectedStylus: Ref<boolean>;
  allowFingerDrawing: Ref<boolean>; // allowFreehand(?)
  showRulerControls: ComputedRef<boolean>;
  selectedTool: Ref<number>;
  isDrawingTool: ComputedRef<boolean>;
  isNonDrawingTool: ComputedRef<boolean>;
  isPaperTool: ComputedRef<boolean>;
  isInteractiveTool: ComputedRef<boolean>;
  isDrawingAllowed: ComputedRef<boolean>;
  selectedToolSize: Ref<number>;
  selectedLineEndSide: Ref<number>;
  selectedLineEndStyle: Ref<number>;
  history: Ref<any[]>;
  historyIndex: Ref<number>;
  hasUndo: ComputedRef<boolean>;
  hasRedo: ComputedRef<boolean>;
  selectedPaperPatternIdx: Ref<number>;
  selectedPaperPattern: ComputedRef<any>;
  selectedPatternStyles: ComputedRef<any>;
  isSwatchOpen: Ref<boolean>;
  selectedPaperSwatchId: Ref<string>;
  selectedPaperColorIdx: Ref<number>;
  selectedPaperColor: ComputedRef<TColor>;
  selectedPatternSwatchId: Ref<string>;
  selectedPatternColorIdx: Ref<number>;
  selectedPatternColor: ComputedRef<TColor>;
  selectedPatternOpacity: Ref<number>;
  selectedFillSwatchId: Ref<string>;
  selectedFillColorIdx: Ref<number>;
  selectedFillColor: ComputedRef<TColor>;
  selectedStrokeSwatchId: Ref<string>;
  selectedStrokeColorIdx: Ref<number>;
  selectedStrokeColor: ComputedRef<TColor>;
}

export interface ICanvasRulerStore {
  isVisibile: boolean;
  width: number;
  transform: ICanvasTransformStore;
}
export interface ICanvasTransformStore {
  translate: number[];
  scale: number[];
  rotate: number;
}
export type ICanvasPasteTransformStore = ICanvasTransformStore;
export interface ICanvasImageTransformStore extends ICanvasTransformStore {
  clipType: string;
  clipStyles: number[];
}
