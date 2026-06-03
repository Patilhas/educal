import { z } from "zod";
import type { TranslationKey } from "@/i18n";
import { CALENDAR_RULE_TYPES } from "@/shared/calendar/types";

type Translator = (key: TranslationKey, variables?: Record<string, string | number>) => string;

export const createEventSchema = (t: Translator) => {
  const occurrenceSchema = z
    .object({
      id: z.string(),
      description: z
        .string()
        .min(1, t("calendar.dialogs.addEditEvent.validations.occurrenceDescriptionRequired")),
      startDate: z.date(t("calendar.dialogs.addEditEvent.validations.occurrenceStartDateRequired")),
      endDate: z.date(t("calendar.dialogs.addEditEvent.validations.occurrenceEndDateRequired")),
    })
    .refine((occurrence) => occurrence.endDate > occurrence.startDate, {
      message: t("calendar.dialogs.addEditEvent.validations.occurrenceEndAfterStart"),
      path: ["endDate"],
    });

  return z.object({
    name: z.string().min(1, t("calendar.dialogs.addEditEvent.validations.eventNameRequired")),
    objective: z.string().min(1, t("calendar.dialogs.addEditEvent.validations.objectiveRequired")),
    daysBetweenOccurrences: z
      .string()
      .regex(/^\d*$/, t("calendar.dialogs.addEditEvent.validations.numericOnly")),
    category: z.string().min(1, t("calendar.dialogs.addEditEvent.validations.categoryRequired")),
    classification: z
      .string()
      .min(1, t("calendar.dialogs.addEditEvent.validations.classificationRequired")),
    status: z.string().min(1, t("calendar.dialogs.addEditEvent.validations.statusRequired")),
    responsible: z.string().min(1, t("calendar.dialogs.addEditEvent.validations.responsibleRequired")),
    rules: z.array(z.enum(CALENDAR_RULE_TYPES)),
    occurrences: z
      .array(occurrenceSchema)
      .min(1, t("calendar.dialogs.addEditEvent.validations.occurrenceRequired")),
  });
};

export type TEventFormData = z.infer<ReturnType<typeof createEventSchema>>;
