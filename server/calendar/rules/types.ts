import type { IEvent, IOccurrence } from "@/shared/calendar/types";
import type { IRuleDefinitionMeta } from "@/shared/calendar/rules/types";

export interface IRuleValidationContext {
  allEvents: IEvent[];
  academicYearStart: number;
}

export interface IRuleViolation {
  fieldLabelKey?: string;
  date: string;
  messageKey: string;
  messageParams?: Record<string, string>;
}

export interface IRuleDefinition<TConfig = Record<string, unknown>> extends IRuleDefinitionMeta {
  validate: (
    event: IEvent,
    occurrence: IOccurrence,
    config: TConfig,
    context: IRuleValidationContext,
  ) => IRuleViolation[];
}
