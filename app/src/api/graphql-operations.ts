import type { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: any;
  GenericScalar: any;
  JSONString: any;
  UUID: any;
};

export type BookshelfNode = Node & {
  __typename?: "BookshelfNode";
  createdAt: Scalars["DateTime"];
  /** The ID of the object */
  id: Scalars["ID"];
  notebookOrder: Array<Scalars["UUID"]>;
  notebooks: NotebookNodeConnection;
  owner: UserNode;
  pk: Scalars["UUID"];
  room: RoomNode;
  updatedAt: Scalars["DateTime"];
};

export type BookshelfNodeNotebooksArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  bookshelf?: InputMaybe<Scalars["ID"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type BookshelfNodeConnection = {
  __typename?: "BookshelfNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<BookshelfNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `BookshelfNode` and its cursor. */
export type BookshelfNodeEdge = {
  __typename?: "BookshelfNodeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<BookshelfNode>;
};

/** An enumeration. */
export enum CoreElementToolChoices {
  /** Eraser */
  A_1 = "A_1",
  /** Clear All */
  A_2 = "A_2",
  /** Pen */
  A_10 = "A_10",
  /** Marker */
  A_11 = "A_11",
  /** Highlighter */
  A_12 = "A_12",
  /** Blob */
  A_20 = "A_20",
  /** Circle */
  A_30 = "A_30",
  /** Rectangle */
  A_31 = "A_31",
  /** Triangle */
  A_32 = "A_32",
  /** Line */
  A_33 = "A_33",
  /** Cut */
  A_40 = "A_40",
  /** Paste */
  A_41 = "A_41",
  /** Image */
  A_50 = "A_50",
  /** Checkbox */
  A_60 = "A_60",
  /** Textbox */
  A_61 = "A_61",
  /** Paper */
  A_70 = "A_70",
}

/** An enumeration. */
export enum CorePaletteSwatchSwatchTypeChoices {
  /** Solid Color */
  A_1 = "A_1",
  /** Linear Gradient Color */
  A_10 = "A_10",
}

export type CreateBookshelfInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  roomPk: Scalars["UUID"];
};

export type CreateBookshelfPayload = {
  __typename?: "CreateBookshelfPayload";
  bookshelf?: Maybe<BookshelfNode>;
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type CreateElementInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  fillColor: Scalars["String"];
  isRulerLine: Scalars["Boolean"];
  options?: InputMaybe<Scalars["JSONString"]>;
  pagePk: Scalars["UUID"];
  points: Array<InputMaybe<Scalars["JSONString"]>>;
  size: Scalars["Float"];
  strokeColor: Scalars["String"];
  tool: Scalars["Int"];
};

export type CreateElementPayload = {
  __typename?: "CreateElementPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  element?: Maybe<ElementNode>;
};

export type CreateNotebookInput = {
  bookshelfPk: Scalars["UUID"];
  clientMutationId?: InputMaybe<Scalars["String"]>;
  title?: InputMaybe<Scalars["String"]>;
};

export type CreateNotebookPayload = {
  __typename?: "CreateNotebookPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  notebook?: Maybe<NotebookNode>;
};

export type CreatePageInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  notebookPk: Scalars["UUID"];
  paperColor?: InputMaybe<Scalars["JSONString"]>;
  patternColor?: InputMaybe<Scalars["JSONString"]>;
  patternOpacity?: InputMaybe<Scalars["Int"]>;
  patternSize?: InputMaybe<Scalars["Float"]>;
  patternSpacing?: InputMaybe<Scalars["Float"]>;
  patternType?: InputMaybe<Scalars["Int"]>;
};

export type CreatePagePayload = {
  __typename?: "CreatePagePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  page?: Maybe<PageNode>;
};

export type CreatePaletteInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  title: Scalars["String"];
};

export type CreatePalettePayload = {
  __typename?: "CreatePalettePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  palette?: Maybe<PaletteNode>;
};

export type CreatePaletteSwatchInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  palettePk: Scalars["UUID"];
  swatch: Scalars["JSONString"];
  swatchType: Scalars["Int"];
};

export type CreatePaletteSwatchPayload = {
  __typename?: "CreatePaletteSwatchPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  swatch?: Maybe<PaletteSwatchNode>;
};

export type DeleteElementInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["UUID"];
};

export type DeleteElementPayload = {
  __typename?: "DeleteElementPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  element?: Maybe<ElementNode>;
};

export type DeleteNotebookInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["UUID"];
};

export type DeleteNotebookPayload = {
  __typename?: "DeleteNotebookPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  notebook?: Maybe<NotebookNode>;
};

export type DeletePageInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["UUID"];
};

export type DeletePagePayload = {
  __typename?: "DeletePagePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  page?: Maybe<PageNode>;
};

export type DeletePaletteInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["UUID"];
};

export type DeletePalettePayload = {
  __typename?: "DeletePalettePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  palette?: Maybe<PaletteNode>;
};

export type DeletePaletteSwatchInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["UUID"];
};

export type DeletePaletteSwatchPayload = {
  __typename?: "DeletePaletteSwatchPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  swatch?: Maybe<PaletteSwatchNode>;
};

export type ElementNode = Node & {
  __typename?: "ElementNode";
  createdAt: Scalars["DateTime"];
  fillColor?: Maybe<Scalars["String"]>;
  /** The ID of the object */
  id: Scalars["ID"];
  isRulerLine: Scalars["Boolean"];
  options?: Maybe<Scalars["JSONString"]>;
  owner: UserNode;
  page: PageNode;
  pk: Scalars["UUID"];
  points: Array<Scalars["JSONString"]>;
  size?: Maybe<Scalars["Float"]>;
  strokeColor?: Maybe<Scalars["String"]>;
  tool?: Maybe<CoreElementToolChoices>;
  updatedAt: Scalars["DateTime"];
};

export type ElementNodeConnection = {
  __typename?: "ElementNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<ElementNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `ElementNode` and its cursor. */
export type ElementNodeEdge = {
  __typename?: "ElementNodeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<ElementNode>;
};

export type Mutation = {
  __typename?: "Mutation";
  createBookshelf?: Maybe<CreateBookshelfPayload>;
  createElement?: Maybe<CreateElementPayload>;
  createNotebook?: Maybe<CreateNotebookPayload>;
  createPage?: Maybe<CreatePagePayload>;
  createPalette?: Maybe<CreatePalettePayload>;
  createPaletteSwatch?: Maybe<CreatePaletteSwatchPayload>;
  deleteElement?: Maybe<DeleteElementPayload>;
  deleteNotebook?: Maybe<DeleteNotebookPayload>;
  deletePage?: Maybe<DeletePagePayload>;
  deletePalette?: Maybe<DeletePalettePayload>;
  deletePaletteSwatch?: Maybe<DeletePaletteSwatchPayload>;
  refreshToken?: Maybe<RefreshPayload>;
  register?: Maybe<RegisterPayload>;
  registerSocial?: Maybe<RegisterFromSocialPayload>;
  revokeToken?: Maybe<RevokePayload>;
  /** Obtain JSON Web Token mutation */
  tokenAuth?: Maybe<ObtainJsonWebTokenPayload>;
  updateBookshelf?: Maybe<UpdateBookshelfPayload>;
  updateElement?: Maybe<UpdateElementPayload>;
  updateNotebook?: Maybe<UpdateNotebookPayload>;
  updatePage?: Maybe<UpdatePagePayload>;
  updatePalette?: Maybe<UpdatePalettePayload>;
  updatePaletteSwatch?: Maybe<UpdatePaletteSwatchPayload>;
  verifyToken?: Maybe<VerifyPayload>;
};

export type MutationCreateBookshelfArgs = {
  input: CreateBookshelfInput;
};

export type MutationCreateElementArgs = {
  input: CreateElementInput;
};

export type MutationCreateNotebookArgs = {
  input: CreateNotebookInput;
};

export type MutationCreatePageArgs = {
  input: CreatePageInput;
};

export type MutationCreatePaletteArgs = {
  input: CreatePaletteInput;
};

export type MutationCreatePaletteSwatchArgs = {
  input: CreatePaletteSwatchInput;
};

export type MutationDeleteElementArgs = {
  input: DeleteElementInput;
};

export type MutationDeleteNotebookArgs = {
  input: DeleteNotebookInput;
};

export type MutationDeletePageArgs = {
  input: DeletePageInput;
};

export type MutationDeletePaletteArgs = {
  input: DeletePaletteInput;
};

export type MutationDeletePaletteSwatchArgs = {
  input: DeletePaletteSwatchInput;
};

export type MutationRefreshTokenArgs = {
  input: RefreshInput;
};

export type MutationRegisterArgs = {
  input: RegisterInput;
};

export type MutationRegisterSocialArgs = {
  input: RegisterFromSocialInput;
};

export type MutationRevokeTokenArgs = {
  input: RevokeInput;
};

export type MutationTokenAuthArgs = {
  input: ObtainJsonWebTokenInput;
};

export type MutationUpdateBookshelfArgs = {
  input: UpdateBookshelfInput;
};

export type MutationUpdateElementArgs = {
  input: UpdateElementInput;
};

export type MutationUpdateNotebookArgs = {
  input: UpdateNotebookInput;
};

export type MutationUpdatePageArgs = {
  input: UpdatePageInput;
};

export type MutationUpdatePaletteArgs = {
  input: UpdatePaletteInput;
};

export type MutationUpdatePaletteSwatchArgs = {
  input: UpdatePaletteSwatchInput;
};

export type MutationVerifyTokenArgs = {
  input: VerifyInput;
};

/** An object with an ID */
export type Node = {
  /** The ID of the object */
  id: Scalars["ID"];
};

export type NotebookNode = Node & {
  __typename?: "NotebookNode";
  bookshelf: BookshelfNode;
  createdAt: Scalars["DateTime"];
  /** The ID of the object */
  id: Scalars["ID"];
  owner: UserNode;
  pageOrder: Array<Scalars["UUID"]>;
  pages: PageNodeConnection;
  pk: Scalars["UUID"];
  title?: Maybe<Scalars["String"]>;
  updatedAt: Scalars["DateTime"];
};

export type NotebookNodePagesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  notebook?: InputMaybe<Scalars["ID"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type NotebookNodeConnection = {
  __typename?: "NotebookNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<NotebookNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `NotebookNode` and its cursor. */
export type NotebookNodeEdge = {
  __typename?: "NotebookNodeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<NotebookNode>;
};

export type ObtainJsonWebTokenInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  password: Scalars["String"];
  username: Scalars["String"];
};

/** Obtain JSON Web Token mutation */
export type ObtainJsonWebTokenPayload = {
  __typename?: "ObtainJSONWebTokenPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  payload: Scalars["GenericScalar"];
  refreshExpiresIn: Scalars["Int"];
  token: Scalars["String"];
};

/** The Relay compliant `PageInfo` type, containing data necessary to paginate this connection. */
export type PageInfo = {
  __typename?: "PageInfo";
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars["String"]>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars["Boolean"];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars["Boolean"];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars["String"]>;
};

export type PageNode = Node & {
  __typename?: "PageNode";
  createdAt: Scalars["DateTime"];
  elements: ElementNodeConnection;
  /** The ID of the object */
  id: Scalars["ID"];
  notebook: NotebookNode;
  owner: UserNode;
  paperColor: Scalars["JSONString"];
  patternColor?: Maybe<Scalars["JSONString"]>;
  patternOpacity?: Maybe<Scalars["Int"]>;
  patternSize?: Maybe<Scalars["Float"]>;
  patternSpacing?: Maybe<Scalars["Float"]>;
  patternType: Scalars["Int"];
  pk: Scalars["UUID"];
  updatedAt: Scalars["DateTime"];
};

export type PageNodeElementsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
  page?: InputMaybe<Scalars["ID"]>;
};

export type PageNodeConnection = {
  __typename?: "PageNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<PageNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `PageNode` and its cursor. */
export type PageNodeEdge = {
  __typename?: "PageNodeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<PageNode>;
};

export type PaletteCollectionNode = Node & {
  __typename?: "PaletteCollectionNode";
  createdAt: Scalars["DateTime"];
  /** The ID of the object */
  id: Scalars["ID"];
  owner: UserNode;
  paletteOrder: Array<Scalars["UUID"]>;
  palettes: PaletteNodeConnection;
  pk: Scalars["UUID"];
  updatedAt: Scalars["DateTime"];
};

export type PaletteCollectionNodePalettesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type PaletteCollectionNodeConnection = {
  __typename?: "PaletteCollectionNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<PaletteCollectionNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `PaletteCollectionNode` and its cursor. */
export type PaletteCollectionNodeEdge = {
  __typename?: "PaletteCollectionNodeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<PaletteCollectionNode>;
};

export type PaletteNode = Node & {
  __typename?: "PaletteNode";
  collection: PaletteCollectionNode;
  createdAt: Scalars["DateTime"];
  /** The ID of the object */
  id: Scalars["ID"];
  owner: UserNode;
  pk: Scalars["UUID"];
  swatches: PaletteSwatchNodeConnection;
  title?: Maybe<Scalars["String"]>;
  updatedAt: Scalars["DateTime"];
};

export type PaletteNodeSwatchesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type PaletteNodeConnection = {
  __typename?: "PaletteNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<PaletteNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `PaletteNode` and its cursor. */
export type PaletteNodeEdge = {
  __typename?: "PaletteNodeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<PaletteNode>;
};

export type PaletteSwatchNode = Node & {
  __typename?: "PaletteSwatchNode";
  createdAt: Scalars["DateTime"];
  /** The ID of the object */
  id: Scalars["ID"];
  owner: UserNode;
  palette: PaletteNode;
  pk: Scalars["UUID"];
  swatch: Scalars["JSONString"];
  swatchType: CorePaletteSwatchSwatchTypeChoices;
  updatedAt: Scalars["DateTime"];
};

export type PaletteSwatchNodeConnection = {
  __typename?: "PaletteSwatchNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<PaletteSwatchNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `PaletteSwatchNode` and its cursor. */
export type PaletteSwatchNodeEdge = {
  __typename?: "PaletteSwatchNodeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<PaletteSwatchNode>;
};

export type Query = {
  __typename?: "Query";
  bookshelf?: Maybe<BookshelfNode>;
  element?: Maybe<ElementNode>;
  me?: Maybe<UserNode>;
  myBookshelves?: Maybe<BookshelfNodeConnection>;
  myElements?: Maybe<ElementNodeConnection>;
  myNotebooks?: Maybe<NotebookNodeConnection>;
  myPages?: Maybe<PageNodeConnection>;
  myPaletteCollections?: Maybe<PaletteCollectionNodeConnection>;
  myPaletteSwatchs?: Maybe<PaletteSwatchNodeConnection>;
  myPalettes?: Maybe<PaletteNodeConnection>;
  myRooms?: Maybe<RoomNodeConnection>;
  notebook?: Maybe<NotebookNode>;
  page?: Maybe<PageNode>;
  palette?: Maybe<PaletteNode>;
  paletteCollection?: Maybe<PaletteCollectionNode>;
  paletteSwatch?: Maybe<PaletteSwatchNode>;
  room?: Maybe<RoomNode>;
  user?: Maybe<UserNode>;
};

export type QueryBookshelfArgs = {
  id: Scalars["ID"];
};

export type QueryElementArgs = {
  id: Scalars["ID"];
};

export type QueryMyBookshelvesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
  room?: InputMaybe<Scalars["ID"]>;
};

export type QueryMyElementsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
  page?: InputMaybe<Scalars["ID"]>;
};

export type QueryMyNotebooksArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  bookshelf?: InputMaybe<Scalars["ID"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type QueryMyPagesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  notebook?: InputMaybe<Scalars["ID"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type QueryMyPaletteCollectionsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type QueryMyPaletteSwatchsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type QueryMyPalettesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type QueryMyRoomsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type QueryNotebookArgs = {
  id: Scalars["ID"];
};

export type QueryPageArgs = {
  id: Scalars["ID"];
};

export type QueryPaletteArgs = {
  id: Scalars["ID"];
};

export type QueryPaletteCollectionArgs = {
  id: Scalars["ID"];
};

export type QueryPaletteSwatchArgs = {
  id: Scalars["ID"];
};

export type QueryRoomArgs = {
  id: Scalars["ID"];
};

export type QueryUserArgs = {
  id: Scalars["ID"];
};

export type RefreshInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  token?: InputMaybe<Scalars["String"]>;
};

export type RefreshPayload = {
  __typename?: "RefreshPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  payload: Scalars["GenericScalar"];
  refreshExpiresIn: Scalars["Int"];
  token: Scalars["String"];
};

export type RegisterFromSocialInput = {
  accessToken: Scalars["String"];
  clientMutationId?: InputMaybe<Scalars["String"]>;
  socialBackend: Scalars["String"];
};

export type RegisterFromSocialPayload = {
  __typename?: "RegisterFromSocialPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  token?: Maybe<Scalars["String"]>;
  user?: Maybe<UserNode>;
};

export type RegisterInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  email: Scalars["String"];
  password: Scalars["String"];
  username: Scalars["String"];
};

export type RegisterPayload = {
  __typename?: "RegisterPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  token?: Maybe<Scalars["String"]>;
  user?: Maybe<UserNode>;
};

export type RevokeInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  refreshToken?: InputMaybe<Scalars["String"]>;
};

export type RevokePayload = {
  __typename?: "RevokePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  revoked: Scalars["Int"];
};

export type RoomNode = Node & {
  __typename?: "RoomNode";
  bookshelfOrder: Array<Scalars["UUID"]>;
  bookshelves: BookshelfNodeConnection;
  createdAt: Scalars["DateTime"];
  /** The ID of the object */
  id: Scalars["ID"];
  owner: UserNode;
  pk: Scalars["UUID"];
  updatedAt: Scalars["DateTime"];
};

export type RoomNodeBookshelvesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
  room?: InputMaybe<Scalars["ID"]>;
};

export type RoomNodeConnection = {
  __typename?: "RoomNodeConnection";
  /** Contains the nodes in this connection. */
  edges: Array<Maybe<RoomNodeEdge>>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
};

/** A Relay edge containing a `RoomNode` and its cursor. */
export type RoomNodeEdge = {
  __typename?: "RoomNodeEdge";
  /** A cursor for use in pagination */
  cursor: Scalars["String"];
  /** The item at the end of the edge */
  node?: Maybe<RoomNode>;
};

export type UpdateBookshelfInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  notebookOrder?: InputMaybe<Array<InputMaybe<Scalars["UUID"]>>>;
  pk: Scalars["UUID"];
};

export type UpdateBookshelfPayload = {
  __typename?: "UpdateBookshelfPayload";
  bookshelf?: Maybe<BookshelfNode>;
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type UpdateElementInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  fillColor?: InputMaybe<Scalars["String"]>;
  isRulerLine?: InputMaybe<Scalars["Boolean"]>;
  options?: InputMaybe<Scalars["JSONString"]>;
  pk: Scalars["UUID"];
  points?: InputMaybe<Array<InputMaybe<Scalars["JSONString"]>>>;
  size?: InputMaybe<Scalars["Float"]>;
  strokeColor?: InputMaybe<Scalars["String"]>;
  tool?: InputMaybe<Scalars["Int"]>;
};

export type UpdateElementPayload = {
  __typename?: "UpdateElementPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  element?: Maybe<ElementNode>;
};

export type UpdateNotebookInput = {
  bookshelfPk?: InputMaybe<Scalars["UUID"]>;
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pageOrder?: InputMaybe<Array<InputMaybe<Scalars["UUID"]>>>;
  pk: Scalars["UUID"];
  title?: InputMaybe<Scalars["String"]>;
};

export type UpdateNotebookPayload = {
  __typename?: "UpdateNotebookPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  notebook?: Maybe<NotebookNode>;
};

export type UpdatePageInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  notebookPk?: InputMaybe<Scalars["UUID"]>;
  paperColor?: InputMaybe<Scalars["JSONString"]>;
  patternColor?: InputMaybe<Scalars["JSONString"]>;
  patternOpacity?: InputMaybe<Scalars["Int"]>;
  patternSize?: InputMaybe<Scalars["Float"]>;
  patternSpacing?: InputMaybe<Scalars["Float"]>;
  patternType?: InputMaybe<Scalars["Int"]>;
  pk: Scalars["UUID"];
};

export type UpdatePagePayload = {
  __typename?: "UpdatePagePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  page?: Maybe<PageNode>;
};

export type UpdatePaletteInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["UUID"];
  title?: InputMaybe<Scalars["String"]>;
};

export type UpdatePalettePayload = {
  __typename?: "UpdatePalettePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  palette?: Maybe<PaletteNode>;
};

export type UpdatePaletteSwatchInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pk: Scalars["UUID"];
  swatch?: InputMaybe<Scalars["JSONString"]>;
  swatchType?: InputMaybe<Scalars["Int"]>;
};

export type UpdatePaletteSwatchPayload = {
  __typename?: "UpdatePaletteSwatchPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  swatch?: Maybe<PaletteSwatchNode>;
};

export type UserNode = Node & {
  __typename?: "UserNode";
  bookshelves: BookshelfNodeConnection;
  dateJoined: Scalars["DateTime"];
  elements: ElementNodeConnection;
  firstName: Scalars["String"];
  /** The ID of the object */
  id: Scalars["ID"];
  /** Designates whether this user should be treated as active. Unselect this instead of deleting accounts. */
  isActive: Scalars["Boolean"];
  /** Designates whether the user can log into this admin site. */
  isStaff: Scalars["Boolean"];
  /** Designates that this user has all permissions without explicitly assigning them. */
  isSuperuser: Scalars["Boolean"];
  lastLogin?: Maybe<Scalars["DateTime"]>;
  lastName: Scalars["String"];
  notebooks: NotebookNodeConnection;
  pages: PageNodeConnection;
  paletteCollection?: Maybe<PaletteCollectionNode>;
  paletteSwatches: PaletteSwatchNodeConnection;
  palettes: PaletteNodeConnection;
  pk: Scalars["UUID"];
  rooms: RoomNodeConnection;
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: Scalars["String"];
};

export type UserNodeBookshelvesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
  room?: InputMaybe<Scalars["ID"]>;
};

export type UserNodeElementsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
  page?: InputMaybe<Scalars["ID"]>;
};

export type UserNodeNotebooksArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  bookshelf?: InputMaybe<Scalars["ID"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type UserNodePagesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  notebook?: InputMaybe<Scalars["ID"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type UserNodePaletteSwatchesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type UserNodePalettesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type UserNodeRoomsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  id?: InputMaybe<Scalars["ID"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type VerifyInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  token?: InputMaybe<Scalars["String"]>;
};

export type VerifyPayload = {
  __typename?: "VerifyPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  payload: Scalars["GenericScalar"];
};

export type CreateElementMutationVariables = Exact<{
  pagePk: Scalars["UUID"];
  tool: Scalars["Int"];
  fillColor: Scalars["String"];
  strokeColor: Scalars["String"];
  size: Scalars["Float"];
  isRulerLine: Scalars["Boolean"];
  points: Array<InputMaybe<Scalars["JSONString"]>> | InputMaybe<Scalars["JSONString"]>;
  options?: InputMaybe<Scalars["JSONString"]>;
}>;

export type CreateElementMutation = {
  __typename?: "Mutation";
  createElement?: {
    __typename?: "CreateElementPayload";
    element?: {
      __typename?: "ElementNode";
      pk: any;
      updatedAt: any;
      createdAt: any;
      tool?: CoreElementToolChoices | null;
      fillColor?: string | null;
      strokeColor?: string | null;
      size?: number | null;
      isRulerLine: boolean;
      points: Array<any>;
      options?: any | null;
      page: { __typename?: "PageNode"; pk: any };
    } | null;
  } | null;
};

export type CreateNotebookMutationVariables = Exact<{
  bookshelfPk: Scalars["UUID"];
  title?: InputMaybe<Scalars["String"]>;
}>;

export type CreateNotebookMutation = {
  __typename?: "Mutation";
  createNotebook?: {
    __typename?: "CreateNotebookPayload";
    notebook?: {
      __typename?: "NotebookNode";
      pk: any;
      updatedAt: any;
      createdAt: any;
      title?: string | null;
      pageOrder: Array<any>;
      bookshelf: { __typename?: "BookshelfNode"; pk: any; notebookOrder: Array<any> };
    } | null;
  } | null;
};

export type CreatePageMutationVariables = Exact<{
  notebookPk: Scalars["UUID"];
  paperColor?: InputMaybe<Scalars["JSONString"]>;
  patternColor?: InputMaybe<Scalars["JSONString"]>;
  patternType?: InputMaybe<Scalars["Int"]>;
  patternSize?: InputMaybe<Scalars["Float"]>;
  patternSpacing?: InputMaybe<Scalars["Float"]>;
  patternOpacity?: InputMaybe<Scalars["Int"]>;
}>;

export type CreatePageMutation = {
  __typename?: "Mutation";
  createPage?: {
    __typename?: "CreatePagePayload";
    page?: {
      __typename?: "PageNode";
      pk: any;
      updatedAt: any;
      createdAt: any;
      paperColor: any;
      patternType: number;
      patternColor?: any | null;
      patternSize?: number | null;
      patternSpacing?: number | null;
      patternOpacity?: number | null;
      notebook: { __typename?: "NotebookNode"; pk: any; pageOrder: Array<any> };
    } | null;
  } | null;
};

export type MyNotebooksQueryVariables = Exact<{
  pk?: InputMaybe<Scalars["ID"]>;
}>;

export type MyNotebooksQuery = {
  __typename?: "Query";
  myNotebooks?: {
    __typename?: "NotebookNodeConnection";
    edges: Array<{
      __typename?: "NotebookNodeEdge";
      node?: {
        __typename?: "NotebookNode";
        pk: any;
        updatedAt: any;
        createdAt: any;
        title?: string | null;
        pageOrder: Array<any>;
        bookshelf: { __typename?: "BookshelfNode"; pk: any };
        pages: {
          __typename?: "PageNodeConnection";
          edges: Array<{
            __typename?: "PageNodeEdge";
            node?: {
              __typename?: "PageNode";
              pk: any;
              updatedAt: any;
              createdAt: any;
              notebook: { __typename?: "NotebookNode"; pk: any };
            } | null;
          } | null>;
        };
      } | null;
    } | null>;
  } | null;
};

export type MyPagesQueryVariables = Exact<{
  pk?: InputMaybe<Scalars["ID"]>;
}>;

export type MyPagesQuery = {
  __typename?: "Query";
  myPages?: {
    __typename?: "PageNodeConnection";
    edges: Array<{
      __typename?: "PageNodeEdge";
      node?: {
        __typename?: "PageNode";
        pk: any;
        updatedAt: any;
        createdAt: any;
        paperColor: any;
        patternColor?: any | null;
        patternType: number;
        patternSize?: number | null;
        patternSpacing?: number | null;
        patternOpacity?: number | null;
        notebook: { __typename?: "NotebookNode"; pk: any };
      } | null;
    } | null>;
  } | null;
};

export type MyPalettesQueryVariables = Exact<{
  pk?: InputMaybe<Scalars["ID"]>;
}>;

export type MyPalettesQuery = {
  __typename?: "Query";
  myPalettes?: {
    __typename?: "PaletteNodeConnection";
    edges: Array<{
      __typename?: "PaletteNodeEdge";
      node?: {
        __typename?: "PaletteNode";
        pk: any;
        updatedAt: any;
        createdAt: any;
        title?: string | null;
        collection: { __typename?: "PaletteCollectionNode"; paletteOrder: Array<any> };
        swatches: {
          __typename?: "PaletteSwatchNodeConnection";
          edges: Array<{
            __typename?: "PaletteSwatchNodeEdge";
            node?: {
              __typename?: "PaletteSwatchNode";
              pk: any;
              swatchType: CorePaletteSwatchSwatchTypeChoices;
              swatch: any;
            } | null;
          } | null>;
        };
      } | null;
    } | null>;
  } | null;
};

export type MyRoomsQueryVariables = Exact<{ [key: string]: never }>;

export type MyRoomsQuery = {
  __typename?: "Query";
  myRooms?: {
    __typename?: "RoomNodeConnection";
    edges: Array<{
      __typename?: "RoomNodeEdge";
      node?: {
        __typename?: "RoomNode";
        pk: any;
        updatedAt: any;
        createdAt: any;
        bookshelfOrder: Array<any>;
        bookshelves: {
          __typename?: "BookshelfNodeConnection";
          edges: Array<{
            __typename?: "BookshelfNodeEdge";
            node?: {
              __typename?: "BookshelfNode";
              pk: any;
              updatedAt: any;
              createdAt: any;
              notebookOrder: Array<any>;
              room: { __typename?: "RoomNode"; pk: any };
              notebooks: {
                __typename?: "NotebookNodeConnection";
                edges: Array<{
                  __typename?: "NotebookNodeEdge";
                  node?: {
                    __typename?: "NotebookNode";
                    pk: any;
                    updatedAt: any;
                    createdAt: any;
                    title?: string | null;
                    pageOrder: Array<any>;
                    bookshelf: { __typename?: "BookshelfNode"; pk: any };
                  } | null;
                } | null>;
              };
            } | null;
          } | null>;
        };
      } | null;
    } | null>;
  } | null;
};

export type RegisterMutationVariables = Exact<{
  username: Scalars["String"];
  email: Scalars["String"];
  password: Scalars["String"];
}>;

export type RegisterMutation = {
  __typename?: "Mutation";
  register?: { __typename?: "RegisterPayload"; token?: string | null } | null;
};

export type RegisterSocialMutationVariables = Exact<{
  accessToken: Scalars["String"];
  socialBackend: Scalars["String"];
}>;

export type RegisterSocialMutation = {
  __typename?: "Mutation";
  registerSocial?: { __typename?: "RegisterFromSocialPayload"; token?: string | null } | null;
};

export type TokenAuthMutationVariables = Exact<{
  username: Scalars["String"];
  password: Scalars["String"];
}>;

export type TokenAuthMutation = {
  __typename?: "Mutation";
  tokenAuth?: { __typename?: "ObtainJSONWebTokenPayload"; token: string } | null;
};

export type VerifyTokenMutationVariables = Exact<{
  token: Scalars["String"];
}>;

export type VerifyTokenMutation = {
  __typename?: "Mutation";
  verifyToken?: { __typename?: "VerifyPayload"; payload: any } | null;
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  __typename?: "Query";
  me?: { __typename?: "UserNode"; username: string; pk: any; id: string } | null;
};

export const CreateElementDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CreateElement" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "pagePk" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "tool" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "Int" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "fillColor" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "strokeColor" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "size" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "Float" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "isRulerLine" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "Boolean" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "points" } },
          type: {
            kind: "NonNullType",
            type: {
              kind: "ListType",
              type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
            },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "options" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "createElement" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "pagePk" },
                      value: { kind: "Variable", name: { kind: "Name", value: "pagePk" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "tool" },
                      value: { kind: "Variable", name: { kind: "Name", value: "tool" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "fillColor" },
                      value: { kind: "Variable", name: { kind: "Name", value: "fillColor" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "strokeColor" },
                      value: { kind: "Variable", name: { kind: "Name", value: "strokeColor" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "size" },
                      value: { kind: "Variable", name: { kind: "Name", value: "size" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "isRulerLine" },
                      value: { kind: "Variable", name: { kind: "Name", value: "isRulerLine" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "points" },
                      value: { kind: "Variable", name: { kind: "Name", value: "points" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "options" },
                      value: { kind: "Variable", name: { kind: "Name", value: "options" } },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "element" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "page" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [{ kind: "Field", name: { kind: "Name", value: "pk" } }],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "pk" } },
                      { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                      { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                      { kind: "Field", name: { kind: "Name", value: "tool" } },
                      { kind: "Field", name: { kind: "Name", value: "fillColor" } },
                      { kind: "Field", name: { kind: "Name", value: "strokeColor" } },
                      { kind: "Field", name: { kind: "Name", value: "size" } },
                      { kind: "Field", name: { kind: "Name", value: "isRulerLine" } },
                      { kind: "Field", name: { kind: "Name", value: "points" } },
                      { kind: "Field", name: { kind: "Name", value: "options" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateElementMutation, CreateElementMutationVariables>;
export const CreateNotebookDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CreateNotebook" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "bookshelfPk" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "title" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "createNotebook" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "bookshelfPk" },
                      value: { kind: "Variable", name: { kind: "Name", value: "bookshelfPk" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "title" },
                      value: { kind: "Variable", name: { kind: "Name", value: "title" } },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "notebook" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "bookshelf" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "pk" } },
                            { kind: "Field", name: { kind: "Name", value: "notebookOrder" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "pk" } },
                      { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                      { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "pageOrder" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateNotebookMutation, CreateNotebookMutationVariables>;
export const CreatePageDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CreatePage" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "notebookPk" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "paperColor" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "patternColor" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "patternType" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "Int" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "patternSize" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "Float" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "patternSpacing" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "Float" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "patternOpacity" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "Int" } },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "createPage" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "notebookPk" },
                      value: { kind: "Variable", name: { kind: "Name", value: "notebookPk" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "paperColor" },
                      value: { kind: "Variable", name: { kind: "Name", value: "paperColor" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "patternColor" },
                      value: { kind: "Variable", name: { kind: "Name", value: "patternColor" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "patternType" },
                      value: { kind: "Variable", name: { kind: "Name", value: "patternType" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "patternSize" },
                      value: { kind: "Variable", name: { kind: "Name", value: "patternSize" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "patternSpacing" },
                      value: { kind: "Variable", name: { kind: "Name", value: "patternSpacing" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "patternOpacity" },
                      value: { kind: "Variable", name: { kind: "Name", value: "patternOpacity" } },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "page" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "notebook" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "pk" } },
                            { kind: "Field", name: { kind: "Name", value: "pageOrder" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "pk" } },
                      { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                      { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                      { kind: "Field", name: { kind: "Name", value: "paperColor" } },
                      { kind: "Field", name: { kind: "Name", value: "patternType" } },
                      { kind: "Field", name: { kind: "Name", value: "patternColor" } },
                      { kind: "Field", name: { kind: "Name", value: "patternSize" } },
                      { kind: "Field", name: { kind: "Name", value: "patternSpacing" } },
                      { kind: "Field", name: { kind: "Name", value: "patternOpacity" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreatePageMutation, CreatePageMutationVariables>;
export const MyNotebooksDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "MyNotebooks" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "pk" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "myNotebooks" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: { kind: "Variable", name: { kind: "Name", value: "pk" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "edges" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "node" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "bookshelf" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  { kind: "Field", name: { kind: "Name", value: "pk" } },
                                ],
                              },
                            },
                            { kind: "Field", name: { kind: "Name", value: "pk" } },
                            { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                            { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                            { kind: "Field", name: { kind: "Name", value: "title" } },
                            { kind: "Field", name: { kind: "Name", value: "pageOrder" } },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "pages" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  {
                                    kind: "Field",
                                    name: { kind: "Name", value: "edges" },
                                    selectionSet: {
                                      kind: "SelectionSet",
                                      selections: [
                                        {
                                          kind: "Field",
                                          name: { kind: "Name", value: "node" },
                                          selectionSet: {
                                            kind: "SelectionSet",
                                            selections: [
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "pk" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "updatedAt" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "createdAt" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "notebook" },
                                                selectionSet: {
                                                  kind: "SelectionSet",
                                                  selections: [
                                                    {
                                                      kind: "Field",
                                                      name: { kind: "Name", value: "pk" },
                                                    },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MyNotebooksQuery, MyNotebooksQueryVariables>;
export const MyPagesDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "MyPages" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "pk" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "myPages" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: { kind: "Variable", name: { kind: "Name", value: "pk" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "edges" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "node" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "notebook" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  { kind: "Field", name: { kind: "Name", value: "pk" } },
                                ],
                              },
                            },
                            { kind: "Field", name: { kind: "Name", value: "pk" } },
                            { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                            { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                            { kind: "Field", name: { kind: "Name", value: "paperColor" } },
                            { kind: "Field", name: { kind: "Name", value: "patternColor" } },
                            { kind: "Field", name: { kind: "Name", value: "patternType" } },
                            { kind: "Field", name: { kind: "Name", value: "patternSize" } },
                            { kind: "Field", name: { kind: "Name", value: "patternSpacing" } },
                            { kind: "Field", name: { kind: "Name", value: "patternOpacity" } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MyPagesQuery, MyPagesQueryVariables>;
export const MyPalettesDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "MyPalettes" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "pk" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "myPalettes" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: { kind: "Variable", name: { kind: "Name", value: "pk" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "edges" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "node" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "collection" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  { kind: "Field", name: { kind: "Name", value: "paletteOrder" } },
                                ],
                              },
                            },
                            { kind: "Field", name: { kind: "Name", value: "pk" } },
                            { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                            { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                            { kind: "Field", name: { kind: "Name", value: "title" } },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "swatches" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  {
                                    kind: "Field",
                                    name: { kind: "Name", value: "edges" },
                                    selectionSet: {
                                      kind: "SelectionSet",
                                      selections: [
                                        {
                                          kind: "Field",
                                          name: { kind: "Name", value: "node" },
                                          selectionSet: {
                                            kind: "SelectionSet",
                                            selections: [
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "pk" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "swatchType" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "swatch" },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MyPalettesQuery, MyPalettesQueryVariables>;
export const MyRoomsDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "MyRooms" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "myRooms" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "edges" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "node" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "pk" } },
                            { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                            { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                            { kind: "Field", name: { kind: "Name", value: "bookshelfOrder" } },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "bookshelves" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  {
                                    kind: "Field",
                                    name: { kind: "Name", value: "edges" },
                                    selectionSet: {
                                      kind: "SelectionSet",
                                      selections: [
                                        {
                                          kind: "Field",
                                          name: { kind: "Name", value: "node" },
                                          selectionSet: {
                                            kind: "SelectionSet",
                                            selections: [
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "room" },
                                                selectionSet: {
                                                  kind: "SelectionSet",
                                                  selections: [
                                                    {
                                                      kind: "Field",
                                                      name: { kind: "Name", value: "pk" },
                                                    },
                                                  ],
                                                },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "pk" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "updatedAt" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "createdAt" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "notebookOrder" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "notebooks" },
                                                selectionSet: {
                                                  kind: "SelectionSet",
                                                  selections: [
                                                    {
                                                      kind: "Field",
                                                      name: { kind: "Name", value: "edges" },
                                                      selectionSet: {
                                                        kind: "SelectionSet",
                                                        selections: [
                                                          {
                                                            kind: "Field",
                                                            name: { kind: "Name", value: "node" },
                                                            selectionSet: {
                                                              kind: "SelectionSet",
                                                              selections: [
                                                                {
                                                                  kind: "Field",
                                                                  name: {
                                                                    kind: "Name",
                                                                    value: "bookshelf",
                                                                  },
                                                                  selectionSet: {
                                                                    kind: "SelectionSet",
                                                                    selections: [
                                                                      {
                                                                        kind: "Field",
                                                                        name: {
                                                                          kind: "Name",
                                                                          value: "pk",
                                                                        },
                                                                      },
                                                                    ],
                                                                  },
                                                                },
                                                                {
                                                                  kind: "Field",
                                                                  name: {
                                                                    kind: "Name",
                                                                    value: "pk",
                                                                  },
                                                                },
                                                                {
                                                                  kind: "Field",
                                                                  name: {
                                                                    kind: "Name",
                                                                    value: "updatedAt",
                                                                  },
                                                                },
                                                                {
                                                                  kind: "Field",
                                                                  name: {
                                                                    kind: "Name",
                                                                    value: "createdAt",
                                                                  },
                                                                },
                                                                {
                                                                  kind: "Field",
                                                                  name: {
                                                                    kind: "Name",
                                                                    value: "title",
                                                                  },
                                                                },
                                                                {
                                                                  kind: "Field",
                                                                  name: {
                                                                    kind: "Name",
                                                                    value: "pageOrder",
                                                                  },
                                                                },
                                                              ],
                                                            },
                                                          },
                                                        ],
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MyRoomsQuery, MyRoomsQueryVariables>;
export const RegisterDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "Register" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "username" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "email" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "password" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "register" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "username" },
                      value: { kind: "Variable", name: { kind: "Name", value: "username" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "email" },
                      value: { kind: "Variable", name: { kind: "Name", value: "email" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "password" },
                      value: { kind: "Variable", name: { kind: "Name", value: "password" } },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [{ kind: "Field", name: { kind: "Name", value: "token" } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RegisterMutation, RegisterMutationVariables>;
export const RegisterSocialDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "RegisterSocial" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "accessToken" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "socialBackend" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "registerSocial" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "accessToken" },
                      value: { kind: "Variable", name: { kind: "Name", value: "accessToken" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "socialBackend" },
                      value: { kind: "Variable", name: { kind: "Name", value: "socialBackend" } },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [{ kind: "Field", name: { kind: "Name", value: "token" } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RegisterSocialMutation, RegisterSocialMutationVariables>;
export const TokenAuthDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "TokenAuth" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "username" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "password" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "tokenAuth" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "username" },
                      value: { kind: "Variable", name: { kind: "Name", value: "username" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "password" },
                      value: { kind: "Variable", name: { kind: "Name", value: "password" } },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [{ kind: "Field", name: { kind: "Name", value: "token" } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<TokenAuthMutation, TokenAuthMutationVariables>;
export const VerifyTokenDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "VerifyToken" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "token" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "verifyToken" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "token" },
                      value: { kind: "Variable", name: { kind: "Name", value: "token" } },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [{ kind: "Field", name: { kind: "Name", value: "payload" } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<VerifyTokenMutation, VerifyTokenMutationVariables>;
export const MeDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "Me" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "me" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "username" } },
                { kind: "Field", name: { kind: "Name", value: "pk" } },
                { kind: "Field", name: { kind: "Name", value: "id" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
