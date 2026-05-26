import { z } from "zod";
import type { TranslationKey } from "@/i18n";

type Translator = (key: TranslationKey, variables?: Record<string, string | number>) => string;

export const createEventSchema = (t: Translator) => {
  const alertSchema = z.object({
    id: z.string(),
    value: z
      .number()
      .int()
      .min(0),
    unit: z.enum(["minutes", "hours", "days", "weeks"]),
  });

  const occurrenceSchema = z
    .object({
      id: z.string(),
      description: z
        .string()
        .min(1, t("calendar.dialogs.addEditEvent.validations.occurrenceDescriptionRequired")),
      startDate: z.date(t("calendar.dialogs.addEditEvent.validations.occurrenceStartDateRequired")),
      endDate: z.date(t("calendar.dialogs.addEditEvent.validations.occurrenceEndDateRequired")),
      alerts: z.array(alertSchema),
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
    occurrences: z
      .array(occurrenceSchema)
      .min(1, t("calendar.dialogs.addEditEvent.validations.occurrenceRequired")),
  });
};

export type TEventFormData = z.infer<ReturnType<typeof createEventSchema>>;
