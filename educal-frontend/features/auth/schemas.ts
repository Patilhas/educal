import { z } from "zod";
import type { TranslationKey } from "@/i18n";

type Translator = (key: TranslationKey, variables?: Record<string, string | number>) => string;

export const createLoginFormSchema = (t: Translator) =>
  z.object({
    email: z.string().email(t("common.auth.login.errors.invalidEmail")),
    password: z.string().min(8, t("common.auth.login.errors.invalidPassword")),
    staySignedIn: z.boolean(),
  });

export type TLoginFormValues = z.infer<ReturnType<typeof createLoginFormSchema>>;
