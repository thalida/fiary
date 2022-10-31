export type TUserId = string;
export type TAuthToken = string;
export interface IUsers {
  [id: TUserId]: IUser;
}
export interface IUser {
  id: TUserId;
  pk: string;
  username: string;
}
