export type TUserRole = "viewer" | "editor" | "admin";

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
  role: TUserRole;
}

export type IUserWithEmail = IUser & {
  email: string;
};

export type IUserStored = IUserWithEmail & {
  passwordHash: string;
};

export type IUserCreatePayload = Omit<IUserWithEmail, "id"> & {
  password: string;
};

export type IUserUpdatePayload = Partial<Omit<IUserWithEmail, "id">> & {
  password?: string;
};

