import { ACTIVE_I18N } from "@/i18n/config";
import type { Dictionary, TranslationKey } from "@/i18n/types";

type TranslationNode = string | string[] | { [key: string]: TranslationNode };

export const translate = (
  key: TranslationKey,
  variables?: Record<string, string | number>,
  dictionary: Dictionary = ACTIVE_I18N.dictionary,
): string => {
  const keys = key.split(".");
  let result: TranslationNode = dictionary as TranslationNode;

  for (const currentKey of keys) {
    if (result && typeof result === "object" && currentKey in result) {
      result = (result as Record<string, TranslationNode>)[currentKey];
    } else {
      return key;
    }
  }

  if (typeof result !== "string") {
    return key;
  }

  let translated = result;
  if (variables) {
    for (const [varName, varValue] of Object.entries(variables)) {
      translated = translated.replace(new RegExp(`{${varName}}`, "g"), String(varValue));
    }
  }

  return translated;
};

