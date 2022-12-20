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

export type BatchSaveElementsInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  elements: Array<InputMaybe<Scalars["JSONString"]>>;
};

export type BatchSaveElementsPayload = {
  __typename?: "BatchSaveElementsPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  elements?: Maybe<Array<Maybe<ElementNode>>>;
};

export type BookshelfNode = Node & {
  __typename?: "BookshelfNode";
  createdAt: Scalars["DateTime"];
  /** The ID of the object */
  id: Scalars["ID"];
  notebookOrder: Array<Scalars["UUID"]>;
  notebooks: NotebookNodeConnection;
  owner: UserNode;
  room: RoomNode;
  uid: Scalars["UUID"];
  updatedAt: Scalars["DateTime"];
};

export type BookshelfNodeNotebooksArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  bookshelf?: InputMaybe<Scalars["ID"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
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

export type CreateBookshelfInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  roomUid: Scalars["UUID"];
};

export type CreateBookshelfPayload = {
  __typename?: "CreateBookshelfPayload";
  bookshelf?: Maybe<BookshelfNode>;
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type CreateElementInput = {
  canvasDataUrl?: InputMaybe<Scalars["String"]>;
  canvasSettings?: InputMaybe<Scalars["JSONString"]>;
  clientMutationId?: InputMaybe<Scalars["String"]>;
  dimensions?: InputMaybe<Scalars["JSONString"]>;
  isCached?: InputMaybe<Scalars["Boolean"]>;
  isHidden?: InputMaybe<Scalars["Boolean"]>;
  isHtmlElement?: InputMaybe<Scalars["Boolean"]>;
  pageUid: Scalars["UUID"];
  points: Scalars["JSONString"];
  settings?: InputMaybe<Scalars["JSONString"]>;
  tool: Scalars["Int"];
  transform?: InputMaybe<Scalars["JSONString"]>;
};

export type CreateElementPayload = {
  __typename?: "CreateElementPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  element?: Maybe<ElementNode>;
};

export type CreateNotebookInput = {
  bookshelfUid: Scalars["UUID"];
  clientMutationId?: InputMaybe<Scalars["String"]>;
  title?: InputMaybe<Scalars["String"]>;
};

export type CreateNotebookPayload = {
  __typename?: "CreateNotebookPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  notebook?: Maybe<NotebookNode>;
};

export type CreatePageInput = {
  canvasDataUrl?: InputMaybe<Scalars["String"]>;
  clientMutationId?: InputMaybe<Scalars["String"]>;
  notebookUid: Scalars["UUID"];
  paperSwatchUid?: InputMaybe<Scalars["UUID"]>;
  patternOpacity?: InputMaybe<Scalars["Int"]>;
  patternSize?: InputMaybe<Scalars["Float"]>;
  patternSpacing?: InputMaybe<Scalars["Float"]>;
  patternSwatchUid?: InputMaybe<Scalars["UUID"]>;
  patternType?: InputMaybe<Scalars["Int"]>;
};

export type CreatePagePayload = {
  __typename?: "CreatePagePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  page?: Maybe<PageNode>;
};

export type CreatePaletteInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  swatches?: InputMaybe<Array<InputMaybe<Scalars["JSONString"]>>>;
  title?: InputMaybe<Scalars["String"]>;
};

export type CreatePalettePayload = {
  __typename?: "CreatePalettePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  palette?: Maybe<PaletteNode>;
};

export type CreatePaletteSwatchInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  paletteUid: Scalars["UUID"];
  swatch: Scalars["JSONString"];
};

export type CreatePaletteSwatchPayload = {
  __typename?: "CreatePaletteSwatchPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  swatch?: Maybe<PaletteSwatchNode>;
};

export type DeleteElementInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  uid: Scalars["UUID"];
};

export type DeleteElementPayload = {
  __typename?: "DeleteElementPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  element?: Maybe<ElementNode>;
};

export type DeleteNotebookInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  uid: Scalars["UUID"];
};

export type DeleteNotebookPayload = {
  __typename?: "DeleteNotebookPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  notebook?: Maybe<NotebookNode>;
};

export type DeletePageInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  uid: Scalars["UUID"];
};

export type DeletePagePayload = {
  __typename?: "DeletePagePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  page?: Maybe<PageNode>;
};

export type DeletePaletteInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  uid: Scalars["UUID"];
};

export type DeletePalettePayload = {
  __typename?: "DeletePalettePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  palette?: Maybe<PaletteNode>;
};

export type DeletePaletteSwatchInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  uid: Scalars["UUID"];
};

export type DeletePaletteSwatchPayload = {
  __typename?: "DeletePaletteSwatchPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  swatch?: Maybe<PaletteSwatchNode>;
};

export type ElementNode = Node & {
  __typename?: "ElementNode";
  canvasDataUrl?: Maybe<Scalars["String"]>;
  canvasSettings?: Maybe<Scalars["JSONString"]>;
  createdAt: Scalars["DateTime"];
  dimensions?: Maybe<Scalars["JSONString"]>;
  /** The ID of the object */
  id: Scalars["ID"];
  isCached: Scalars["Boolean"];
  isHidden: Scalars["Boolean"];
  isHtmlElement: Scalars["Boolean"];
  owner: UserNode;
  page: PageNode;
  points: Scalars["JSONString"];
  settings?: Maybe<Scalars["JSONString"]>;
  tool: Scalars["Int"];
  transform?: Maybe<Scalars["JSONString"]>;
  uid: Scalars["UUID"];
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
  batchSaveElements?: Maybe<BatchSaveElementsPayload>;
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

export type MutationBatchSaveElementsArgs = {
  input: BatchSaveElementsInput;
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
  title?: Maybe<Scalars["String"]>;
  uid: Scalars["UUID"];
  updatedAt: Scalars["DateTime"];
};

export type NotebookNodePagesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  notebook?: InputMaybe<Scalars["ID"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
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
  canvasDataUrl?: Maybe<Scalars["String"]>;
  createdAt: Scalars["DateTime"];
  elementOrder: Array<Scalars["UUID"]>;
  elements: ElementNodeConnection;
  /** The ID of the object */
  id: Scalars["ID"];
  notebook: NotebookNode;
  owner: UserNode;
  paperSwatch?: Maybe<PaletteSwatchNode>;
  patternOpacity?: Maybe<Scalars["Int"]>;
  patternSize?: Maybe<Scalars["Float"]>;
  patternSpacing?: Maybe<Scalars["Float"]>;
  patternSwatch?: Maybe<PaletteSwatchNode>;
  patternType: Scalars["Int"];
  uid: Scalars["UUID"];
  updatedAt: Scalars["DateTime"];
};

export type PageNodeElementsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  isHtmlElement?: InputMaybe<Scalars["Boolean"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  page_Uid?: InputMaybe<Scalars["UUID"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
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
  uid: Scalars["UUID"];
  updatedAt: Scalars["DateTime"];
};

export type PaletteCollectionNodePalettesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
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
  collections: PaletteCollectionNodeConnection;
  createdAt: Scalars["DateTime"];
  /** The ID of the object */
  id: Scalars["ID"];
  isPublic: Scalars["Boolean"];
  owner: UserNode;
  paletteType: Scalars["Int"];
  swatches: PaletteSwatchNodeConnection;
  title?: Maybe<Scalars["String"]>;
  uid: Scalars["UUID"];
  updatedAt: Scalars["DateTime"];
};

export type PaletteNodeCollectionsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type PaletteNodeSwatchesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
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
  isDefault: Scalars["Boolean"];
  owner: UserNode;
  palette: PaletteNode;
  paperSwatch: PageNodeConnection;
  patternSwatch: PageNodeConnection;
  swatch: Scalars["JSONString"];
  uid: Scalars["UUID"];
  updatedAt: Scalars["DateTime"];
};

export type PaletteSwatchNodePaperSwatchArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  notebook?: InputMaybe<Scalars["ID"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type PaletteSwatchNodePatternSwatchArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  notebook?: InputMaybe<Scalars["ID"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
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
  myPaletteCollection?: Maybe<PaletteCollectionNodeConnection>;
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
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  room?: InputMaybe<Scalars["ID"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type QueryMyElementsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  isHtmlElement?: InputMaybe<Scalars["Boolean"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  page_Uid?: InputMaybe<Scalars["UUID"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type QueryMyNotebooksArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  bookshelf?: InputMaybe<Scalars["ID"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type QueryMyPagesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  notebook?: InputMaybe<Scalars["ID"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type QueryMyPaletteCollectionArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type QueryMyPaletteSwatchsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type QueryMyPalettesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type QueryMyRoomsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
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
  uid: Scalars["UUID"];
  updatedAt: Scalars["DateTime"];
};

export type RoomNodeBookshelvesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  room?: InputMaybe<Scalars["ID"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
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
  uid: Scalars["UUID"];
};

export type UpdateBookshelfPayload = {
  __typename?: "UpdateBookshelfPayload";
  bookshelf?: Maybe<BookshelfNode>;
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type UpdateElementInput = {
  canvasDataUrl?: InputMaybe<Scalars["String"]>;
  canvasSettings?: InputMaybe<Scalars["JSONString"]>;
  clientMutationId?: InputMaybe<Scalars["String"]>;
  dimensions?: InputMaybe<Scalars["JSONString"]>;
  isCached?: InputMaybe<Scalars["Boolean"]>;
  isHidden?: InputMaybe<Scalars["Boolean"]>;
  isHtmlElement?: InputMaybe<Scalars["Boolean"]>;
  pageUid?: InputMaybe<Scalars["UUID"]>;
  points?: InputMaybe<Scalars["JSONString"]>;
  settings?: InputMaybe<Scalars["JSONString"]>;
  tool?: InputMaybe<Scalars["Int"]>;
  transform?: InputMaybe<Scalars["JSONString"]>;
  uid: Scalars["UUID"];
};

export type UpdateElementPayload = {
  __typename?: "UpdateElementPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  element?: Maybe<ElementNode>;
};

export type UpdateNotebookInput = {
  bookshelfUid?: InputMaybe<Scalars["UUID"]>;
  clientMutationId?: InputMaybe<Scalars["String"]>;
  pageOrder?: InputMaybe<Array<InputMaybe<Scalars["UUID"]>>>;
  title?: InputMaybe<Scalars["String"]>;
  uid: Scalars["UUID"];
};

export type UpdateNotebookPayload = {
  __typename?: "UpdateNotebookPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  notebook?: Maybe<NotebookNode>;
};

export type UpdatePageInput = {
  canvasDataUrl?: InputMaybe<Scalars["String"]>;
  clientMutationId?: InputMaybe<Scalars["String"]>;
  notebookUid?: InputMaybe<Scalars["UUID"]>;
  paperSwatchUid?: InputMaybe<Scalars["UUID"]>;
  patternOpacity?: InputMaybe<Scalars["Int"]>;
  patternSize?: InputMaybe<Scalars["Float"]>;
  patternSpacing?: InputMaybe<Scalars["Float"]>;
  patternSwatchUid?: InputMaybe<Scalars["UUID"]>;
  patternType?: InputMaybe<Scalars["Int"]>;
  uid: Scalars["UUID"];
};

export type UpdatePagePayload = {
  __typename?: "UpdatePagePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  page?: Maybe<PageNode>;
};

export type UpdatePaletteInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  title?: InputMaybe<Scalars["String"]>;
  uid: Scalars["UUID"];
};

export type UpdatePalettePayload = {
  __typename?: "UpdatePalettePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  palette?: Maybe<PaletteNode>;
};

export type UpdatePaletteSwatchInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  swatch?: InputMaybe<Scalars["JSONString"]>;
  uid: Scalars["UUID"];
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
  rooms: RoomNodeConnection;
  uid: Scalars["UUID"];
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: Scalars["String"];
};

export type UserNodeBookshelvesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  room?: InputMaybe<Scalars["ID"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type UserNodeElementsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  isHtmlElement?: InputMaybe<Scalars["Boolean"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  page_Uid?: InputMaybe<Scalars["UUID"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type UserNodeNotebooksArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  bookshelf?: InputMaybe<Scalars["ID"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type UserNodePagesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  notebook?: InputMaybe<Scalars["ID"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type UserNodePaletteSwatchesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type UserNodePalettesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
};

export type UserNodeRoomsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  uid?: InputMaybe<Scalars["UUID"]>;
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

export type BatchSaveElementsMutationVariables = Exact<{
  elements: Array<InputMaybe<Scalars["JSONString"]>> | InputMaybe<Scalars["JSONString"]>;
}>;

export type BatchSaveElementsMutation = {
  __typename?: "Mutation";
  batchSaveElements?: {
    __typename?: "BatchSaveElementsPayload";
    elements?: Array<{
      __typename?: "ElementNode";
      uid: any;
      updatedAt: any;
      createdAt: any;
      tool: number;
      points: any;
      settings?: any | null;
      transform?: any | null;
      dimensions?: any | null;
      canvasSettings?: any | null;
      canvasDataUrl?: string | null;
      isCached: boolean;
      isHtmlElement: boolean;
      isHidden: boolean;
      page: { __typename?: "PageNode"; uid: any; elementOrder: Array<any> };
    } | null> | null;
  } | null;
};

export type CreateElementMutationVariables = Exact<{
  pageUid: Scalars["UUID"];
  tool: Scalars["Int"];
  points: Scalars["JSONString"];
  settings?: InputMaybe<Scalars["JSONString"]>;
  transform?: InputMaybe<Scalars["JSONString"]>;
  dimensions?: InputMaybe<Scalars["JSONString"]>;
  canvasSettings?: InputMaybe<Scalars["JSONString"]>;
  canvasDataUrl?: InputMaybe<Scalars["String"]>;
  isCached?: InputMaybe<Scalars["Boolean"]>;
  isHtmlElement?: InputMaybe<Scalars["Boolean"]>;
  isHidden?: InputMaybe<Scalars["Boolean"]>;
}>;

export type CreateElementMutation = {
  __typename?: "Mutation";
  createElement?: {
    __typename?: "CreateElementPayload";
    element?: {
      __typename?: "ElementNode";
      uid: any;
      updatedAt: any;
      createdAt: any;
      tool: number;
      points: any;
      settings?: any | null;
      transform?: any | null;
      dimensions?: any | null;
      canvasSettings?: any | null;
      canvasDataUrl?: string | null;
      isCached: boolean;
      isHtmlElement: boolean;
      isHidden: boolean;
      page: { __typename?: "PageNode"; uid: any; elementOrder: Array<any> };
    } | null;
  } | null;
};

export type CreateNotebookMutationVariables = Exact<{
  bookshelfUid: Scalars["UUID"];
  title?: InputMaybe<Scalars["String"]>;
}>;

export type CreateNotebookMutation = {
  __typename?: "Mutation";
  createNotebook?: {
    __typename?: "CreateNotebookPayload";
    notebook?: {
      __typename?: "NotebookNode";
      uid: any;
      updatedAt: any;
      createdAt: any;
      title?: string | null;
      pageOrder: Array<any>;
      bookshelf: { __typename?: "BookshelfNode"; uid: any; notebookOrder: Array<any> };
    } | null;
  } | null;
};

export type CreatePageMutationVariables = Exact<{
  notebookUid: Scalars["UUID"];
  paperSwatchUid: Scalars["UUID"];
  patternSwatchUid?: InputMaybe<Scalars["UUID"]>;
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
      uid: any;
      updatedAt: any;
      createdAt: any;
      patternType: number;
      patternSize?: number | null;
      patternSpacing?: number | null;
      patternOpacity?: number | null;
      elementOrder: Array<any>;
      canvasDataUrl?: string | null;
      notebook: { __typename?: "NotebookNode"; uid: any; pageOrder: Array<any> };
      paperSwatch?: {
        __typename?: "PaletteSwatchNode";
        uid: any;
        palette: { __typename?: "PaletteNode"; uid: any };
      } | null;
      patternSwatch?: {
        __typename?: "PaletteSwatchNode";
        uid: any;
        palette: { __typename?: "PaletteNode"; uid: any };
      } | null;
    } | null;
  } | null;
};

export type CreatePaletteMutationVariables = Exact<{
  title?: InputMaybe<Scalars["String"]>;
  swatches?: InputMaybe<
    Array<InputMaybe<Scalars["JSONString"]>> | InputMaybe<Scalars["JSONString"]>
  >;
}>;

export type CreatePaletteMutation = {
  __typename?: "Mutation";
  createPalette?: {
    __typename?: "CreatePalettePayload";
    palette?: {
      __typename?: "PaletteNode";
      uid: any;
      updatedAt: any;
      createdAt: any;
      title?: string | null;
      paletteType: number;
      isPublic: boolean;
      collections: {
        __typename?: "PaletteCollectionNodeConnection";
        edges: Array<{
          __typename?: "PaletteCollectionNodeEdge";
          node?: {
            __typename?: "PaletteCollectionNode";
            uid: any;
            paletteOrder: Array<any>;
          } | null;
        } | null>;
      };
      swatches: {
        __typename?: "PaletteSwatchNodeConnection";
        edges: Array<{
          __typename?: "PaletteSwatchNodeEdge";
          node?: {
            __typename?: "PaletteSwatchNode";
            uid: any;
            swatch: any;
            isDefault: boolean;
          } | null;
        } | null>;
      };
    } | null;
  } | null;
};

export type CreatePaletteSwatchMutationVariables = Exact<{
  paletteUid: Scalars["UUID"];
  swatch: Scalars["JSONString"];
}>;

export type CreatePaletteSwatchMutation = {
  __typename?: "Mutation";
  createPaletteSwatch?: {
    __typename?: "CreatePaletteSwatchPayload";
    swatch?: {
      __typename?: "PaletteSwatchNode";
      uid: any;
      swatch: any;
      isDefault: boolean;
      palette: { __typename?: "PaletteNode"; uid: any };
    } | null;
  } | null;
};

export type UpdateElementMutationVariables = Exact<{
  uid: Scalars["UUID"];
  pageUid?: InputMaybe<Scalars["UUID"]>;
  tool?: InputMaybe<Scalars["Int"]>;
  points: Scalars["JSONString"];
  settings?: InputMaybe<Scalars["JSONString"]>;
  transform?: InputMaybe<Scalars["JSONString"]>;
  dimensions?: InputMaybe<Scalars["JSONString"]>;
  canvasSettings?: InputMaybe<Scalars["JSONString"]>;
  canvasDataUrl?: InputMaybe<Scalars["String"]>;
  isCached?: InputMaybe<Scalars["Boolean"]>;
  isHtmlElement?: InputMaybe<Scalars["Boolean"]>;
  isHidden?: InputMaybe<Scalars["Boolean"]>;
}>;

export type UpdateElementMutation = {
  __typename?: "Mutation";
  updateElement?: {
    __typename?: "UpdateElementPayload";
    element?: {
      __typename?: "ElementNode";
      uid: any;
      updatedAt: any;
      createdAt: any;
      tool: number;
      points: any;
      settings?: any | null;
      transform?: any | null;
      dimensions?: any | null;
      canvasSettings?: any | null;
      canvasDataUrl?: string | null;
      isCached: boolean;
      isHtmlElement: boolean;
      isHidden: boolean;
      page: { __typename?: "PageNode"; uid: any; elementOrder: Array<any> };
    } | null;
  } | null;
};

export type UpdatePageMutationVariables = Exact<{
  uid: Scalars["UUID"];
  notebookUid?: InputMaybe<Scalars["UUID"]>;
  paperSwatchUid?: InputMaybe<Scalars["UUID"]>;
  patternSwatchUid?: InputMaybe<Scalars["UUID"]>;
  patternType?: InputMaybe<Scalars["Int"]>;
  patternSize?: InputMaybe<Scalars["Float"]>;
  patternSpacing?: InputMaybe<Scalars["Float"]>;
  patternOpacity?: InputMaybe<Scalars["Int"]>;
  canvasDataUrl?: InputMaybe<Scalars["String"]>;
}>;

export type UpdatePageMutation = {
  __typename?: "Mutation";
  updatePage?: {
    __typename?: "UpdatePagePayload";
    page?: {
      __typename?: "PageNode";
      uid: any;
      updatedAt: any;
      createdAt: any;
      patternType: number;
      patternSize?: number | null;
      patternSpacing?: number | null;
      patternOpacity?: number | null;
      elementOrder: Array<any>;
      canvasDataUrl?: string | null;
      notebook: { __typename?: "NotebookNode"; uid: any; pageOrder: Array<any> };
      paperSwatch?: {
        __typename?: "PaletteSwatchNode";
        uid: any;
        palette: { __typename?: "PaletteNode"; uid: any };
      } | null;
      patternSwatch?: {
        __typename?: "PaletteSwatchNode";
        uid: any;
        palette: { __typename?: "PaletteNode"; uid: any };
      } | null;
    } | null;
  } | null;
};

export type UpdatePaletteSwatchMutationVariables = Exact<{
  uid: Scalars["UUID"];
  swatch?: InputMaybe<Scalars["JSONString"]>;
}>;

export type UpdatePaletteSwatchMutation = {
  __typename?: "Mutation";
  updatePaletteSwatch?: {
    __typename?: "UpdatePaletteSwatchPayload";
    swatch?: {
      __typename?: "PaletteSwatchNode";
      uid: any;
      swatch: any;
      isDefault: boolean;
      palette: { __typename?: "PaletteNode"; uid: any };
    } | null;
  } | null;
};

export type MyElementsQueryVariables = Exact<{
  uid?: InputMaybe<Scalars["UUID"]>;
  pageUid?: InputMaybe<Scalars["UUID"]>;
  isHtmlElement?: InputMaybe<Scalars["Boolean"]>;
}>;

export type MyElementsQuery = {
  __typename?: "Query";
  myElements?: {
    __typename?: "ElementNodeConnection";
    edges: Array<{
      __typename?: "ElementNodeEdge";
      node?: {
        __typename?: "ElementNode";
        uid: any;
        updatedAt: any;
        createdAt: any;
        tool: number;
        points: any;
        settings?: any | null;
        transform?: any | null;
        dimensions?: any | null;
        canvasSettings?: any | null;
        canvasDataUrl?: string | null;
        isCached: boolean;
        isHtmlElement: boolean;
        isHidden: boolean;
        page: { __typename?: "PageNode"; uid: any; elementOrder: Array<any> };
      } | null;
    } | null>;
  } | null;
};

export type MyNotebooksQueryVariables = Exact<{
  uid?: InputMaybe<Scalars["UUID"]>;
}>;

export type MyNotebooksQuery = {
  __typename?: "Query";
  myNotebooks?: {
    __typename?: "NotebookNodeConnection";
    edges: Array<{
      __typename?: "NotebookNodeEdge";
      node?: {
        __typename?: "NotebookNode";
        uid: any;
        updatedAt: any;
        createdAt: any;
        title?: string | null;
        pageOrder: Array<any>;
        bookshelf: { __typename?: "BookshelfNode"; uid: any };
        pages: {
          __typename?: "PageNodeConnection";
          edges: Array<{
            __typename?: "PageNodeEdge";
            node?: {
              __typename?: "PageNode";
              uid: any;
              updatedAt: any;
              createdAt: any;
              notebook: { __typename?: "NotebookNode"; uid: any };
            } | null;
          } | null>;
        };
      } | null;
    } | null>;
  } | null;
};

export type MyPagesQueryVariables = Exact<{
  uid?: InputMaybe<Scalars["UUID"]>;
}>;

export type MyPagesQuery = {
  __typename?: "Query";
  myPages?: {
    __typename?: "PageNodeConnection";
    edges: Array<{
      __typename?: "PageNodeEdge";
      node?: {
        __typename?: "PageNode";
        uid: any;
        updatedAt: any;
        createdAt: any;
        patternType: number;
        patternSize?: number | null;
        patternSpacing?: number | null;
        patternOpacity?: number | null;
        elementOrder: Array<any>;
        canvasDataUrl?: string | null;
        notebook: { __typename?: "NotebookNode"; uid: any };
        paperSwatch?: {
          __typename?: "PaletteSwatchNode";
          uid: any;
          palette: { __typename?: "PaletteNode"; uid: any };
        } | null;
        patternSwatch?: {
          __typename?: "PaletteSwatchNode";
          uid: any;
          palette: { __typename?: "PaletteNode"; uid: any };
        } | null;
      } | null;
    } | null>;
  } | null;
};

export type MyPaletteCollectionQueryVariables = Exact<{
  uid?: InputMaybe<Scalars["UUID"]>;
}>;

export type MyPaletteCollectionQuery = {
  __typename?: "Query";
  myPaletteCollection?: {
    __typename?: "PaletteCollectionNodeConnection";
    edges: Array<{
      __typename?: "PaletteCollectionNodeEdge";
      node?: {
        __typename?: "PaletteCollectionNode";
        uid: any;
        paletteOrder: Array<any>;
        palettes: {
          __typename?: "PaletteNodeConnection";
          edges: Array<{
            __typename?: "PaletteNodeEdge";
            node?: {
              __typename?: "PaletteNode";
              uid: any;
              updatedAt: any;
              createdAt: any;
              title?: string | null;
              isPublic: boolean;
              paletteType: number;
              swatches: {
                __typename?: "PaletteSwatchNodeConnection";
                edges: Array<{
                  __typename?: "PaletteSwatchNodeEdge";
                  node?: {
                    __typename?: "PaletteSwatchNode";
                    uid: any;
                    swatch: any;
                    isDefault: boolean;
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

export type MyPalettesQueryVariables = Exact<{
  uid?: InputMaybe<Scalars["UUID"]>;
}>;

export type MyPalettesQuery = {
  __typename?: "Query";
  myPalettes?: {
    __typename?: "PaletteNodeConnection";
    edges: Array<{
      __typename?: "PaletteNodeEdge";
      node?: {
        __typename?: "PaletteNode";
        uid: any;
        updatedAt: any;
        createdAt: any;
        title?: string | null;
        paletteType: number;
        isPublic: boolean;
        collections: {
          __typename?: "PaletteCollectionNodeConnection";
          edges: Array<{
            __typename?: "PaletteCollectionNodeEdge";
            node?: {
              __typename?: "PaletteCollectionNode";
              uid: any;
              paletteOrder: Array<any>;
            } | null;
          } | null>;
        };
        swatches: {
          __typename?: "PaletteSwatchNodeConnection";
          edges: Array<{
            __typename?: "PaletteSwatchNodeEdge";
            node?: {
              __typename?: "PaletteSwatchNode";
              uid: any;
              swatch: any;
              isDefault: boolean;
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
        uid: any;
        updatedAt: any;
        createdAt: any;
        bookshelfOrder: Array<any>;
        bookshelves: {
          __typename?: "BookshelfNodeConnection";
          edges: Array<{
            __typename?: "BookshelfNodeEdge";
            node?: {
              __typename?: "BookshelfNode";
              uid: any;
              updatedAt: any;
              createdAt: any;
              notebookOrder: Array<any>;
              room: { __typename?: "RoomNode"; uid: any };
              notebooks: {
                __typename?: "NotebookNodeConnection";
                edges: Array<{
                  __typename?: "NotebookNodeEdge";
                  node?: {
                    __typename?: "NotebookNode";
                    uid: any;
                    updatedAt: any;
                    createdAt: any;
                    title?: string | null;
                    pageOrder: Array<any>;
                    bookshelf: { __typename?: "BookshelfNode"; uid: any };
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
  me?: { __typename?: "UserNode"; uid: any; username: string } | null;
};

export const BatchSaveElementsDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "BatchSaveElements" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "elements" } },
          type: {
            kind: "NonNullType",
            type: {
              kind: "ListType",
              type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "batchSaveElements" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "elements" },
                      value: { kind: "Variable", name: { kind: "Name", value: "elements" } },
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
                  name: { kind: "Name", value: "elements" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "page" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            { kind: "Field", name: { kind: "Name", value: "elementOrder" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "uid" } },
                      { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                      { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                      { kind: "Field", name: { kind: "Name", value: "tool" } },
                      { kind: "Field", name: { kind: "Name", value: "points" } },
                      { kind: "Field", name: { kind: "Name", value: "settings" } },
                      { kind: "Field", name: { kind: "Name", value: "transform" } },
                      { kind: "Field", name: { kind: "Name", value: "dimensions" } },
                      { kind: "Field", name: { kind: "Name", value: "canvasSettings" } },
                      { kind: "Field", name: { kind: "Name", value: "canvasDataUrl" } },
                      { kind: "Field", name: { kind: "Name", value: "isCached" } },
                      { kind: "Field", name: { kind: "Name", value: "isHtmlElement" } },
                      { kind: "Field", name: { kind: "Name", value: "isHidden" } },
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
} as unknown as DocumentNode<BatchSaveElementsMutation, BatchSaveElementsMutationVariables>;
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
          variable: { kind: "Variable", name: { kind: "Name", value: "pageUid" } },
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
          variable: { kind: "Variable", name: { kind: "Name", value: "points" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "settings" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "transform" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "dimensions" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "canvasSettings" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "canvasDataUrl" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "isCached" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "Boolean" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "isHtmlElement" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "Boolean" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "isHidden" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "Boolean" } },
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
                      name: { kind: "Name", value: "pageUid" },
                      value: { kind: "Variable", name: { kind: "Name", value: "pageUid" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "tool" },
                      value: { kind: "Variable", name: { kind: "Name", value: "tool" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "points" },
                      value: { kind: "Variable", name: { kind: "Name", value: "points" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "settings" },
                      value: { kind: "Variable", name: { kind: "Name", value: "settings" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "transform" },
                      value: { kind: "Variable", name: { kind: "Name", value: "transform" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "dimensions" },
                      value: { kind: "Variable", name: { kind: "Name", value: "dimensions" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "canvasSettings" },
                      value: { kind: "Variable", name: { kind: "Name", value: "canvasSettings" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "canvasDataUrl" },
                      value: { kind: "Variable", name: { kind: "Name", value: "canvasDataUrl" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "isCached" },
                      value: { kind: "Variable", name: { kind: "Name", value: "isCached" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "isHtmlElement" },
                      value: { kind: "Variable", name: { kind: "Name", value: "isHtmlElement" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "isHidden" },
                      value: { kind: "Variable", name: { kind: "Name", value: "isHidden" } },
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
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            { kind: "Field", name: { kind: "Name", value: "elementOrder" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "uid" } },
                      { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                      { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                      { kind: "Field", name: { kind: "Name", value: "tool" } },
                      { kind: "Field", name: { kind: "Name", value: "points" } },
                      { kind: "Field", name: { kind: "Name", value: "settings" } },
                      { kind: "Field", name: { kind: "Name", value: "transform" } },
                      { kind: "Field", name: { kind: "Name", value: "dimensions" } },
                      { kind: "Field", name: { kind: "Name", value: "canvasSettings" } },
                      { kind: "Field", name: { kind: "Name", value: "canvasDataUrl" } },
                      { kind: "Field", name: { kind: "Name", value: "isCached" } },
                      { kind: "Field", name: { kind: "Name", value: "isHtmlElement" } },
                      { kind: "Field", name: { kind: "Name", value: "isHidden" } },
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
          variable: { kind: "Variable", name: { kind: "Name", value: "bookshelfUid" } },
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
                      name: { kind: "Name", value: "bookshelfUid" },
                      value: { kind: "Variable", name: { kind: "Name", value: "bookshelfUid" } },
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
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            { kind: "Field", name: { kind: "Name", value: "notebookOrder" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "uid" } },
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
          variable: { kind: "Variable", name: { kind: "Name", value: "notebookUid" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "paperSwatchUid" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "patternSwatchUid" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
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
                      name: { kind: "Name", value: "notebookUid" },
                      value: { kind: "Variable", name: { kind: "Name", value: "notebookUid" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "paperSwatchUid" },
                      value: { kind: "Variable", name: { kind: "Name", value: "paperSwatchUid" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "patternSwatchUid" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "patternSwatchUid" },
                      },
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
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            { kind: "Field", name: { kind: "Name", value: "pageOrder" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "uid" } },
                      { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                      { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "paperSwatch" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "palette" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  { kind: "Field", name: { kind: "Name", value: "uid" } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "patternSwatch" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "palette" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  { kind: "Field", name: { kind: "Name", value: "uid" } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "patternType" } },
                      { kind: "Field", name: { kind: "Name", value: "patternSize" } },
                      { kind: "Field", name: { kind: "Name", value: "patternSpacing" } },
                      { kind: "Field", name: { kind: "Name", value: "patternOpacity" } },
                      { kind: "Field", name: { kind: "Name", value: "elementOrder" } },
                      { kind: "Field", name: { kind: "Name", value: "canvasDataUrl" } },
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
export const CreatePaletteDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CreatePalette" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "title" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "swatches" } },
          type: {
            kind: "ListType",
            type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "createPalette" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "title" },
                      value: { kind: "Variable", name: { kind: "Name", value: "title" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "swatches" },
                      value: { kind: "Variable", name: { kind: "Name", value: "swatches" } },
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
                  name: { kind: "Name", value: "palette" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "uid" } },
                      { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                      { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "paletteType" } },
                      { kind: "Field", name: { kind: "Name", value: "isPublic" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "collections" },
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
                                        { kind: "Field", name: { kind: "Name", value: "uid" } },
                                        {
                                          kind: "Field",
                                          name: { kind: "Name", value: "paletteOrder" },
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
                                        { kind: "Field", name: { kind: "Name", value: "uid" } },
                                        { kind: "Field", name: { kind: "Name", value: "swatch" } },
                                        {
                                          kind: "Field",
                                          name: { kind: "Name", value: "isDefault" },
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
} as unknown as DocumentNode<CreatePaletteMutation, CreatePaletteMutationVariables>;
export const CreatePaletteSwatchDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CreatePaletteSwatch" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "paletteUid" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "swatch" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "createPaletteSwatch" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "paletteUid" },
                      value: { kind: "Variable", name: { kind: "Name", value: "paletteUid" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "swatch" },
                      value: { kind: "Variable", name: { kind: "Name", value: "swatch" } },
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
                  name: { kind: "Name", value: "swatch" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "uid" } },
                      { kind: "Field", name: { kind: "Name", value: "swatch" } },
                      { kind: "Field", name: { kind: "Name", value: "isDefault" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "palette" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [{ kind: "Field", name: { kind: "Name", value: "uid" } }],
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
} as unknown as DocumentNode<CreatePaletteSwatchMutation, CreatePaletteSwatchMutationVariables>;
export const UpdateElementDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UpdateElement" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "uid" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "pageUid" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "tool" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "Int" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "points" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "settings" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "transform" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "dimensions" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "canvasSettings" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "canvasDataUrl" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "isCached" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "Boolean" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "isHtmlElement" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "Boolean" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "isHidden" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "Boolean" } },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "updateElement" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "uid" },
                      value: { kind: "Variable", name: { kind: "Name", value: "uid" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "pageUid" },
                      value: { kind: "Variable", name: { kind: "Name", value: "pageUid" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "tool" },
                      value: { kind: "Variable", name: { kind: "Name", value: "tool" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "points" },
                      value: { kind: "Variable", name: { kind: "Name", value: "points" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "settings" },
                      value: { kind: "Variable", name: { kind: "Name", value: "settings" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "transform" },
                      value: { kind: "Variable", name: { kind: "Name", value: "transform" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "dimensions" },
                      value: { kind: "Variable", name: { kind: "Name", value: "dimensions" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "canvasSettings" },
                      value: { kind: "Variable", name: { kind: "Name", value: "canvasSettings" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "canvasDataUrl" },
                      value: { kind: "Variable", name: { kind: "Name", value: "canvasDataUrl" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "isCached" },
                      value: { kind: "Variable", name: { kind: "Name", value: "isCached" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "isHtmlElement" },
                      value: { kind: "Variable", name: { kind: "Name", value: "isHtmlElement" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "isHidden" },
                      value: { kind: "Variable", name: { kind: "Name", value: "isHidden" } },
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
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            { kind: "Field", name: { kind: "Name", value: "elementOrder" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "uid" } },
                      { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                      { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                      { kind: "Field", name: { kind: "Name", value: "tool" } },
                      { kind: "Field", name: { kind: "Name", value: "points" } },
                      { kind: "Field", name: { kind: "Name", value: "settings" } },
                      { kind: "Field", name: { kind: "Name", value: "transform" } },
                      { kind: "Field", name: { kind: "Name", value: "dimensions" } },
                      { kind: "Field", name: { kind: "Name", value: "canvasSettings" } },
                      { kind: "Field", name: { kind: "Name", value: "canvasDataUrl" } },
                      { kind: "Field", name: { kind: "Name", value: "isCached" } },
                      { kind: "Field", name: { kind: "Name", value: "isHtmlElement" } },
                      { kind: "Field", name: { kind: "Name", value: "isHidden" } },
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
} as unknown as DocumentNode<UpdateElementMutation, UpdateElementMutationVariables>;
export const UpdatePageDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UpdatePage" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "uid" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "notebookUid" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "paperSwatchUid" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "patternSwatchUid" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
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
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "canvasDataUrl" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "String" } },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "updatePage" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "uid" },
                      value: { kind: "Variable", name: { kind: "Name", value: "uid" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "notebookUid" },
                      value: { kind: "Variable", name: { kind: "Name", value: "notebookUid" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "paperSwatchUid" },
                      value: { kind: "Variable", name: { kind: "Name", value: "paperSwatchUid" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "patternSwatchUid" },
                      value: {
                        kind: "Variable",
                        name: { kind: "Name", value: "patternSwatchUid" },
                      },
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
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "canvasDataUrl" },
                      value: { kind: "Variable", name: { kind: "Name", value: "canvasDataUrl" } },
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
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            { kind: "Field", name: { kind: "Name", value: "pageOrder" } },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "uid" } },
                      { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                      { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "paperSwatch" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "palette" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  { kind: "Field", name: { kind: "Name", value: "uid" } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "patternSwatch" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "palette" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  { kind: "Field", name: { kind: "Name", value: "uid" } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      { kind: "Field", name: { kind: "Name", value: "patternType" } },
                      { kind: "Field", name: { kind: "Name", value: "patternSize" } },
                      { kind: "Field", name: { kind: "Name", value: "patternSpacing" } },
                      { kind: "Field", name: { kind: "Name", value: "patternOpacity" } },
                      { kind: "Field", name: { kind: "Name", value: "elementOrder" } },
                      { kind: "Field", name: { kind: "Name", value: "canvasDataUrl" } },
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
} as unknown as DocumentNode<UpdatePageMutation, UpdatePageMutationVariables>;
export const UpdatePaletteSwatchDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "UpdatePaletteSwatch" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "uid" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "swatch" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "JSONString" } },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "updatePaletteSwatch" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "ObjectValue",
                  fields: [
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "uid" },
                      value: { kind: "Variable", name: { kind: "Name", value: "uid" } },
                    },
                    {
                      kind: "ObjectField",
                      name: { kind: "Name", value: "swatch" },
                      value: { kind: "Variable", name: { kind: "Name", value: "swatch" } },
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
                  name: { kind: "Name", value: "swatch" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "uid" } },
                      { kind: "Field", name: { kind: "Name", value: "swatch" } },
                      { kind: "Field", name: { kind: "Name", value: "isDefault" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "palette" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [{ kind: "Field", name: { kind: "Name", value: "uid" } }],
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
} as unknown as DocumentNode<UpdatePaletteSwatchMutation, UpdatePaletteSwatchMutationVariables>;
export const MyElementsDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "MyElements" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "uid" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "pageUid" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
        },
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "isHtmlElement" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "Boolean" } },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "myElements" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "uid" },
                value: { kind: "Variable", name: { kind: "Name", value: "uid" } },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "page_Uid" },
                value: { kind: "Variable", name: { kind: "Name", value: "pageUid" } },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "isHtmlElement" },
                value: { kind: "Variable", name: { kind: "Name", value: "isHtmlElement" } },
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
                              name: { kind: "Name", value: "page" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  { kind: "Field", name: { kind: "Name", value: "uid" } },
                                  { kind: "Field", name: { kind: "Name", value: "elementOrder" } },
                                ],
                              },
                            },
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                            { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                            { kind: "Field", name: { kind: "Name", value: "tool" } },
                            { kind: "Field", name: { kind: "Name", value: "points" } },
                            { kind: "Field", name: { kind: "Name", value: "settings" } },
                            { kind: "Field", name: { kind: "Name", value: "transform" } },
                            { kind: "Field", name: { kind: "Name", value: "dimensions" } },
                            { kind: "Field", name: { kind: "Name", value: "canvasSettings" } },
                            { kind: "Field", name: { kind: "Name", value: "canvasDataUrl" } },
                            { kind: "Field", name: { kind: "Name", value: "isCached" } },
                            { kind: "Field", name: { kind: "Name", value: "isHtmlElement" } },
                            { kind: "Field", name: { kind: "Name", value: "isHidden" } },
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
} as unknown as DocumentNode<MyElementsQuery, MyElementsQueryVariables>;
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
          variable: { kind: "Variable", name: { kind: "Name", value: "uid" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
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
                name: { kind: "Name", value: "uid" },
                value: { kind: "Variable", name: { kind: "Name", value: "uid" } },
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
                                  { kind: "Field", name: { kind: "Name", value: "uid" } },
                                ],
                              },
                            },
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
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
                                                name: { kind: "Name", value: "uid" },
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
                                                      name: { kind: "Name", value: "uid" },
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
          variable: { kind: "Variable", name: { kind: "Name", value: "uid" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
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
                name: { kind: "Name", value: "uid" },
                value: { kind: "Variable", name: { kind: "Name", value: "uid" } },
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
                                  { kind: "Field", name: { kind: "Name", value: "uid" } },
                                ],
                              },
                            },
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                            { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "paperSwatch" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  { kind: "Field", name: { kind: "Name", value: "uid" } },
                                  {
                                    kind: "Field",
                                    name: { kind: "Name", value: "palette" },
                                    selectionSet: {
                                      kind: "SelectionSet",
                                      selections: [
                                        { kind: "Field", name: { kind: "Name", value: "uid" } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "patternSwatch" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  { kind: "Field", name: { kind: "Name", value: "uid" } },
                                  {
                                    kind: "Field",
                                    name: { kind: "Name", value: "palette" },
                                    selectionSet: {
                                      kind: "SelectionSet",
                                      selections: [
                                        { kind: "Field", name: { kind: "Name", value: "uid" } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            { kind: "Field", name: { kind: "Name", value: "patternType" } },
                            { kind: "Field", name: { kind: "Name", value: "patternSize" } },
                            { kind: "Field", name: { kind: "Name", value: "patternSpacing" } },
                            { kind: "Field", name: { kind: "Name", value: "patternOpacity" } },
                            { kind: "Field", name: { kind: "Name", value: "elementOrder" } },
                            { kind: "Field", name: { kind: "Name", value: "canvasDataUrl" } },
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
export const MyPaletteCollectionDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "MyPaletteCollection" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "uid" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "myPaletteCollection" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "uid" },
                value: { kind: "Variable", name: { kind: "Name", value: "uid" } },
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
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            { kind: "Field", name: { kind: "Name", value: "paletteOrder" } },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "palettes" },
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
                                                name: { kind: "Name", value: "uid" },
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
                                                name: { kind: "Name", value: "title" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "isPublic" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "paletteType" },
                                              },
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
                                                                  name: {
                                                                    kind: "Name",
                                                                    value: "uid",
                                                                  },
                                                                },
                                                                {
                                                                  kind: "Field",
                                                                  name: {
                                                                    kind: "Name",
                                                                    value: "swatch",
                                                                  },
                                                                },
                                                                {
                                                                  kind: "Field",
                                                                  name: {
                                                                    kind: "Name",
                                                                    value: "isDefault",
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
} as unknown as DocumentNode<MyPaletteCollectionQuery, MyPaletteCollectionQueryVariables>;
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
          variable: { kind: "Variable", name: { kind: "Name", value: "uid" } },
          type: { kind: "NamedType", name: { kind: "Name", value: "UUID" } },
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
                name: { kind: "Name", value: "uid" },
                value: { kind: "Variable", name: { kind: "Name", value: "uid" } },
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
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
                            { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                            { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                            { kind: "Field", name: { kind: "Name", value: "title" } },
                            { kind: "Field", name: { kind: "Name", value: "paletteType" } },
                            { kind: "Field", name: { kind: "Name", value: "isPublic" } },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "collections" },
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
                                                name: { kind: "Name", value: "uid" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "paletteOrder" },
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
                                                name: { kind: "Name", value: "uid" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "swatch" },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "isDefault" },
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
                            { kind: "Field", name: { kind: "Name", value: "uid" } },
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
                                                      name: { kind: "Name", value: "uid" },
                                                    },
                                                  ],
                                                },
                                              },
                                              {
                                                kind: "Field",
                                                name: { kind: "Name", value: "uid" },
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
                                                                          value: "uid",
                                                                        },
                                                                      },
                                                                    ],
                                                                  },
                                                                },
                                                                {
                                                                  kind: "Field",
                                                                  name: {
                                                                    kind: "Name",
                                                                    value: "uid",
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
                { kind: "Field", name: { kind: "Name", value: "uid" } },
                { kind: "Field", name: { kind: "Name", value: "username" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
