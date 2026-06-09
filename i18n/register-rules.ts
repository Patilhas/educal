import { ACTIVE_I18N } from "./config";
import type { IRuleDefinitionMeta } from "@/shared/calendar/rules/types";

export function registerRuleTranslations(rules: IRuleDefinitionMeta[]): void {
  const { collatorLocale, dictionary } = ACTIVE_I18N;
  const lang = collatorLocale.split("-")[0];
  const calendarDict = dictionary.calendar as unknown as Record<string, unknown>;

  calendarDict.rules = Object.fromEntries(
    rules.map((rule) => [
      rule.id,
      rule.translations[collatorLocale] ?? rule.translations[lang] ?? Object.values(rule.translations)[0],
    ]),
  );
}
