import type { IUser, IUserStored, IUserWithEmail } from "@/shared/user/types";

export interface AuthSessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthDb {
  users: IUserStored[];
  sessions: AuthSessionRecord[];
}

export const toCalendarUser = (user: IUserStored): IUser => ({
  id: user.id,
  name: user.name,
  picturePath: user.picturePath,
  role: user.role,
});

export const toUserWithEmail = (user: IUserStored): IUserWithEmail => ({
  id: user.id,
  name: user.name,
  picturePath: user.picturePath,
  role: user.role,
  email: user.email,
});

