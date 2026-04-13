"use client"

import { useCallback } from "react";
import { ACTIVE_I18N } from "./config";
import type { Dictionary, TranslationKey } from "./types";

type TranslationNode = string | string[] | { [key: string]: TranslationNode };

export function useTranslations() {
  const dictionary: Dictionary = ACTIVE_I18N.dictionary;

  const t = useCallback(
    (key: TranslationKey, variables?: Record<string, string | number>) => {
      const keys = key.split(".");
      let result: TranslationNode = dictionary as TranslationNode;

      for (const k of keys) {
        if (result && typeof result === "object" && k in result) {
          result = (result as Record<string, TranslationNode>)[k];
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
