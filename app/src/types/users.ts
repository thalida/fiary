import type { TPrimaryKey } from "./core";

export type TAuthToken = string;
export interface IUsers {
  [key: TPrimaryKey]: IUser;
}
export interface IUser {
  uid: TPrimaryKey;
  pk: string;
  username: string;
}
export interface IRegisterUser {
  username: string;
  password: string;
  email: string;
}
export interface ILoginUser {
  username: string;
  password: string;
}
