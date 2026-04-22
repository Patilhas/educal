"use client"

import { useCallback } from "react";
import { ACTIVE_I18N } from "./config";
import type { Dictionary, TranslationKey } from "./types";
import { translate } from "./translate";

export function useTranslations() {
  const dictionary: Dictionary = ACTIVE_I18N.dictionary;

  const t = useCallback(
    (key: TranslationKey, variables?: Record<string, string | number>) => {
      return translate(key, variables, dictionary);
    },
    [dictionary]
  );

  return { t };
}
