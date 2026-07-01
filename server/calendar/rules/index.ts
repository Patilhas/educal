import { weekendRule } from "./definitions/weekend.rule";
import { holidayRule } from "./definitions/holiday.rule";
import { vacationPeriodRule } from "./definitions/vacation-period.rule";
import { eventNoOverlapRule } from "./definitions/event-no-overlap.rule";
import { minGapToEventRule } from "./definitions/min-gap-to-event.rule";
import { minDurationRule } from "./definitions/min-duration.rule";
import { minDaysToNextRule } from "./definitions/min-days-to-next.rule";
import type { IRuleDefinition, IRuleViolation, IRuleValidationContext } from "./types";
import type { IRuleDefinitionMeta } from "@/shared/calendar/rules/types";
import type { IEvent, IEventRule, IOccurrence } from "@/shared/calendar/types";

export type { IRuleDefinition, IRuleViolation, IRuleValidationContext } from "./types";
export { minDurationRule, minDaysToNextRule };

export const SERVER_RULES: IRuleDefinition[] = [
  weekendRule,
  holidayRule,
  vacationPeriodRule,
  eventNoOverlapRule,
  minGapToEventRule,
  minDurationRule,
  minDaysToNextRule,
];

function getServerRule(id: string): IRuleDefinition | undefined {
  return SERVER_RULES.find((r) => r.id === id);
}

export function getRulesMetadata(): IRuleDefinitionMeta[] {
  return SERVER_RULES.map(({ validate: _validate, ...meta }) => meta);
}

export function validateEventRule(
  rule: IEventRule,
  event: IEvent,
  occurrence: IOccurrence,
  context: IRuleValidationContext,
): IRuleViolation[] {
  const definition = getServerRule(rule.type);
  if (!definition) return [];
  return definition.validate(event, occurrence, rule.config, context);
}
