import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "A password deve ter pelo menos 8 caracteres"),
  staySignedIn: z.boolean(),
});

export type TLoginFormValues = z.infer<typeof loginFormSchema>;


