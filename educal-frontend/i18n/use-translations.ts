import { useCallback } from "react";
import { pt } from "./pt";
import type { Dictionary, TranslationKey } from "./types";

export function useTranslations() {
  const dictionary = pt;

  const t = useCallback(
    (key: TranslationKey, variables?: Record<string, string | number>) => {
      const keys = key.split(".");
      let result: any = dictionary;

      for (const k of keys) {
        if (result && typeof result === "object" && k in result) {
          result = result[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }

      if (typeof result !== "string") {
        console.warn(`Translation key does not point to a string: ${key}`);
        return key;
      }

      let translatedString = result;
      if (variables) {
        for (const [varName, varValue] of Object.entries(variables)) {
          translatedString = translatedString.replace(
            new RegExp(`{${varName}}`, "g"),
            String(varValue)
          );
        }
      }

      return translatedString;
    },
    [dictionary]
  );

  return { t };
}
