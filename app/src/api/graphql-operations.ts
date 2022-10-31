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

export type CreateBookshelfInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  roomId: Scalars["UUID"];
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
  pageId: Scalars["UUID"];
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
  bookshelfId: Scalars["UUID"];
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
  notebookId: Scalars["UUID"];
  patternColor?: InputMaybe<Scalars["String"]>;
  patternSize?: InputMaybe<Scalars["Float"]>;
  patternSpacing?: InputMaybe<Scalars["Float"]>;
  patternStyle?: InputMaybe<Scalars["String"]>;
};

export type CreatePagePayload = {
  __typename?: "CreatePagePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  page?: Maybe<PageNode>;
};

export type CreateRoomInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
};

export type CreateRoomPayload = {
  __typename?: "CreateRoomPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  room?: Maybe<RoomNode>;
};

export type DeleteElementInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  id: Scalars["UUID"];
};

export type DeleteElementPayload = {
  __typename?: "DeleteElementPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  element?: Maybe<ElementNode>;
};

export type DeleteNotebookInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  id: Scalars["UUID"];
};

export type DeleteNotebookPayload = {
  __typename?: "DeleteNotebookPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  notebook?: Maybe<NotebookNode>;
};

export type DeletePageInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  id: Scalars["UUID"];
};

export type DeletePagePayload = {
  __typename?: "DeletePagePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  page?: Maybe<PageNode>;
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
  tool?: Maybe<FiaryElementToolChoices>;
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

/** An enumeration. */
export enum FiaryElementToolChoices {
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

export type Mutation = {
  __typename?: "Mutation";
  createBookshelf?: Maybe<CreateBookshelfPayload>;
  createElement?: Maybe<CreateElementPayload>;
  createNotebook?: Maybe<CreateNotebookPayload>;
  createPage?: Maybe<CreatePagePayload>;
  createRoom?: Maybe<CreateRoomPayload>;
  deleteElement?: Maybe<DeleteElementPayload>;
  deleteNotebook?: Maybe<DeleteNotebookPayload>;
  deletePage?: Maybe<DeletePagePayload>;
  refreshToken?: Maybe<RefreshPayload>;
  register?: Maybe<RegisterPayload>;
  revokeToken?: Maybe<RevokePayload>;
  /** Obtain JSON Web Token mutation */
  tokenAuth?: Maybe<ObtainJsonWebTokenPayload>;
  updateBookshelf?: Maybe<UpdateBookshelfPayload>;
  updateElement?: Maybe<UpdateElementPayload>;
  updateNotebook?: Maybe<UpdateNotebookPayload>;
  updatePage?: Maybe<UpdatePagePayload>;
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

export type MutationCreateRoomArgs = {
  input: CreateRoomInput;
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

export type MutationRefreshTokenArgs = {
  input: RefreshInput;
};

export type MutationRegisterArgs = {
  input: RegisterInput;
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
  color?: Maybe<Scalars["String"]>;
  createdAt: Scalars["DateTime"];
  elements: ElementNodeConnection;
  /** The ID of the object */
  id: Scalars["ID"];
  notebook: NotebookNode;
  owner: UserNode;
  patternColor?: Maybe<Scalars["String"]>;
  patternSize?: Maybe<Scalars["Float"]>;
  patternSpacing?: Maybe<Scalars["Float"]>;
  patternStyle?: Maybe<Scalars["String"]>;
  pk: Scalars["UUID"];
  updatedAt: Scalars["DateTime"];
};

export type PageNodeElementsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
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

export type Query = {
  __typename?: "Query";
  bookshelf?: Maybe<BookshelfNode>;
  element?: Maybe<ElementNode>;
  me?: Maybe<UserNode>;
  myBookshelves?: Maybe<BookshelfNodeConnection>;
  myElements?: Maybe<ElementNodeConnection>;
  myNotebooks?: Maybe<NotebookNodeConnection>;
  myPages?: Maybe<PageNodeConnection>;
  myRooms?: Maybe<RoomNodeConnection>;
  notebook?: Maybe<NotebookNode>;
  page?: Maybe<PageNode>;
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
  owner?: InputMaybe<Scalars["ID"]>;
  room?: InputMaybe<Scalars["ID"]>;
};

export type QueryMyElementsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
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
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type QueryMyPagesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  notebook?: InputMaybe<Scalars["ID"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type QueryMyRoomsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
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

export type RegisterInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  email: Scalars["String"];
  password: Scalars["String"];
  password2: Scalars["String"];
  username: Scalars["String"];
};

export type RegisterPayload = {
  __typename?: "RegisterPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
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
  bookshelfId: Scalars["UUID"];
  clientMutationId?: InputMaybe<Scalars["String"]>;
  notebookOrder?: InputMaybe<Array<InputMaybe<Scalars["UUID"]>>>;
};

export type UpdateBookshelfPayload = {
  __typename?: "UpdateBookshelfPayload";
  bookshelf?: Maybe<BookshelfNode>;
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type UpdateElementInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  fillColor?: InputMaybe<Scalars["String"]>;
  id: Scalars["UUID"];
  isRulerLine?: InputMaybe<Scalars["Boolean"]>;
  options?: InputMaybe<Scalars["JSONString"]>;
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
  bookshelfId?: InputMaybe<Scalars["UUID"]>;
  clientMutationId?: InputMaybe<Scalars["String"]>;
  id: Scalars["UUID"];
  pageOrder?: InputMaybe<Array<InputMaybe<Scalars["UUID"]>>>;
  title?: InputMaybe<Scalars["String"]>;
};

export type UpdateNotebookPayload = {
  __typename?: "UpdateNotebookPayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  notebook?: Maybe<NotebookNode>;
};

export type UpdatePageInput = {
  clientMutationId?: InputMaybe<Scalars["String"]>;
  id: Scalars["UUID"];
  notebookId?: InputMaybe<Scalars["UUID"]>;
  patternColor?: InputMaybe<Scalars["String"]>;
  patternSize?: InputMaybe<Scalars["Float"]>;
  patternSpacing?: InputMaybe<Scalars["Float"]>;
  patternStyle?: InputMaybe<Scalars["String"]>;
};

export type UpdatePagePayload = {
  __typename?: "UpdatePagePayload";
  clientMutationId?: Maybe<Scalars["String"]>;
  page?: Maybe<PageNode>;
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
  pk: Scalars["UUID"];
  rooms: RoomNodeConnection;
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: Scalars["String"];
};

export type UserNodeBookshelvesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
  room?: InputMaybe<Scalars["ID"]>;
};

export type UserNodeElementsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
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
  last?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type UserNodePagesArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
  last?: InputMaybe<Scalars["Int"]>;
  notebook?: InputMaybe<Scalars["ID"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  owner?: InputMaybe<Scalars["ID"]>;
};

export type UserNodeRoomsArgs = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["Int"]>;
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
