export type TUserId = string;
export interface IUsers {
  [id: TUserId]: IUser;
}
export interface IUser {
  id: TUserId;
  pk: string;
  username: string;
  token?: string;
}
