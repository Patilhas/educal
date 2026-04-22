import {
  type IUserCreatePayload,
  type IUserUpdatePayload,
  type IUserWithEmail,
} from "@/shared/user/types";
import { requestJson } from "@/lib/api-client";

export const createUserRequest = async (
  payload: IUserCreatePayload,
): Promise<IUserWithEmail> => {
  return requestJson<IUserWithEmail>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateUserRequest = async (
  userId: string,
  payload: IUserUpdatePayload,
): Promise<IUserWithEmail> => {
  return requestJson<IUserWithEmail>(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteUserRequest = async (userId: string) => {
  return requestJson<{ deleted: boolean }>(`/api/users/${userId}`, {
    method: "DELETE",
  });
};

