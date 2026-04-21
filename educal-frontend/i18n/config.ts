import { setDefaultOptions } from "date-fns";
import type { Locale } from "date-fns";
import { pt as ptDateFns } from "date-fns/locale";
import { z } from "zod"
import { pt } from "./pt";
import type { Dictionary } from "./types";
import { $ZodErrorMap } from "zod/v4/core"

interface I18nConfig {
  dictionary: Dictionary;
  dateFnsLocale: Locale;
  collatorLocale: string;
  zodLocale: () => { localeError: $ZodErrorMap }
}

const I18N_CONFIG = {
  "pt-PT": {
    dictionary: pt,
    dateFnsLocale: ptDateFns,
    collatorLocale: "pt-PT",
    zodLocale: () => z.locales.pt(),
  },
} satisfies Record<string, I18nConfig>;

const DEFAULT_LANGUAGE = "pt-PT";

export const ACTIVE_I18N = I18N_CONFIG[DEFAULT_LANGUAGE];

setDefaultOptions({ locale: ACTIVE_I18N.dateFnsLocale });
z.config(ACTIVE_I18N.zodLocale());
