import { z } from "zod";
import type { TranslationKey } from "@/i18n";

type Translator = (key: TranslationKey, variables?: Record<string, string | number>) => string;

const optionalPositiveNumber = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null) return undefined
  return Number(val)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}, z.number().positive().optional()) as z.ZodType<number | undefined, any, any>

export const createEventSchema = (t: Translator) => {
  const occurrenceSchema = z
    .object({
      id: z.string(),
      description: z
        .string()
        .min(1, t("calendar.dialogs.addEditEvent.validations.occurrenceDescriptionRequired")),
      startDate: z.date(t("calendar.dialogs.addEditEvent.validations.occurrenceStartDateRequired")),
      endDate: z.date(t("calendar.dialogs.addEditEvent.validations.occurrenceEndDateRequired")),
      minDays: optionalPositiveNumber,
      minDaysToNext: optionalPositiveNumber,
      notifyDaysBeforeOverride: optionalPositiveNumber,
    })
    .refine((occurrence) => occurrence.endDate > occurrence.startDate, {
      message: t("calendar.dialogs.addEditEvent.validations.occurrenceEndAfterStart"),
      path: ["endDate"],
    });

  return z.object({
    name: z.string().min(1, t("calendar.dialogs.addEditEvent.validations.eventNameRequired")),
    objective: z.string().min(1, t("calendar.dialogs.addEditEvent.validations.objectiveRequired")),
    academicYearStart: z.number().int().positive(),
    category: z.string().min(1, t("calendar.dialogs.addEditEvent.validations.categoryRequired")),
    classification: z
      .string()
      .min(1, t("calendar.dialogs.addEditEvent.validations.classificationRequired")),
    status: z.string().min(1, t("calendar.dialogs.addEditEvent.validations.statusRequired")),
    responsible: z.string().min(1, t("calendar.dialogs.addEditEvent.validations.responsibleRequired")),
    notifyDaysBefore: optionalPositiveNumber,
    rules: z.array(
      z.object({
        type: z.string().min(1),
        config: z.record(z.string(), z.unknown()),
      }),
    ),
    occurrences: z
      .array(occurrenceSchema)
      .min(1, t("calendar.dialogs.addEditEvent.validations.occurrenceRequired")),
  });
};

export type TEventFormData = z.infer<ReturnType<typeof createEventSchema>>;
