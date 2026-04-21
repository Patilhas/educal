import { z } from "zod";
import { createUserPayloadSchema, userRoleSchema } from "@/shared/user/schemas";
import type { IUserWithEmail } from "@/shared/user/types";

export const userFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  role: userRoleSchema,
  picturePath: z.string(),
  password: z.string(),
});

export const createUserFormSchema = userFormSchema.extend({
  password: z.string().min(8),
});

export const editUserFormSchema = userFormSchema.extend({
  password: z.string().refine((value) => value.trim().length === 0 || value.trim().length >= 8, {
    message: "A nova password tem de ter pelo menos 8 caracteres.",
  }),
});

export type TCreateUserFormValues = z.infer<typeof createUserFormSchema>;
export type TEditUserFormValues = z.infer<typeof editUserFormSchema>;

export const EMPTY_CREATE_FORM: TCreateUserFormValues = {
  name: "",
  email: "",
  role: "viewer",
  picturePath: "",
  password: "",
};

export const toEditFormValues = (user: IUserWithEmail): TEditUserFormValues => ({
  name: user.name,
  email: user.email,
  role: user.role,
  picturePath: user.picturePath ?? "",
  password: "",
});

export const normalizePicturePath = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const parseCreateUserPayload = (values: TCreateUserFormValues) =>
  createUserPayloadSchema.parse({
    ...values,
    name: values.name.trim(),
    email: values.email.trim(),
    picturePath: normalizePicturePath(values.picturePath),
  });
