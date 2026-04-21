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

export type IUserCreatePayload = Pick<IUserWithEmail, "name" | "email" | "role" | "picturePath"> & {
  password: string;
};

export type IUserUpdatePayload = Partial<
  Pick<IUserWithEmail, "name" | "email" | "role" | "picturePath">
> & {
  password?: string;
};

