import { z } from "zod";

export const userRoleSchema = z.enum(["viewer", "editor", "admin"]);

export const userSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  picturePath: z.string().nullable(),
  role: userRoleSchema,
});

export const userWithEmailSchema = userSchema.extend({
  email: z.string().email(),
});

export const userWithEmailListSchema = z.array(userWithEmailSchema);

const userNameSchema = z.string().trim().min(1).max(120);
const userPicturePathSchema = z.string().trim().min(1).max(512).nullable();

export const createUserPayloadSchema = z.object({
  name: userNameSchema,
  email: z.string().email(),
  role: userRoleSchema,
  password: z.string().min(8),
  picturePath: userPicturePathSchema.optional().default(null),
});

export const updateUserPayloadSchema = z
  .object({
    name: userNameSchema.optional(),
    email: z.string().email().optional(),
    role: userRoleSchema.optional(),
    password: z.string().min(8).optional(),
    picturePath: userPicturePathSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe pelo menos um campo para atualizar",
  });

