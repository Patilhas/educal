import { z } from "zod";
import { calendarData } from "@/server/calendar/data/calendar.data";
import { DomainError } from "@/server/shared/domain-error";
import { SERVER_RULES } from "@/server/calendar/rules";

const dateLikeString = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Data inválida",
  });

export const occurrencePayloadSchema = z
  .object({
    id: z.string().min(1),
    description: z.string().min(1),
    startDate: dateLikeString,
    endDate: dateLikeString,
  })
  .refine((value) => new Date(value.endDate) > new Date(value.startDate), {
    message: "A data de fim deve ser posterior à data de início",
    path: ["endDate"],
  });

/**
 * Build a Zod event schema whose enum values are loaded dynamically from the
 * data layer.  Call this inside a request handler — never at module load time —
 * so that the data is always fresh.
 */
export async function buildEventPayloadSchema() {
  const [categories, classifications, statuses, responsibles] =
    await Promise.all([
      calendarData.listCategories(),
      calendarData.listClassifications(),
      calendarData.listStatuses(),
      calendarData.listResponsibles(),
    ]);

  const categoryValues = categories.map((c) => c.value);
  const classificationValues = classifications.map((c) => c.value);
  const statusValues = statuses.map((s) => s.name);
  const responsibleValues = responsibles.map((r) => r.value);

  if (
    categoryValues.length === 0 ||
    classificationValues.length === 0 ||
    statusValues.length === 0 ||
    responsibleValues.length === 0
  ) {
    throw new DomainError(
      "INTERNAL_ERROR",
      500,
      "Unable to build event schema: reference data (categories, classifications, statuses, or responsibles) is empty."
    );
  }

  return z.object({
    name: z.string().min(1),
    objective: z.string().min(1),
    daysBetweenOccurrences: z.string().regex(/^\d*$/),
    academicYearStart: z.number().int().positive().optional(),
    category: z.enum(categoryValues as [string, ...string[]]),
    classification: z.enum(classificationValues as [string, ...string[]]),
    status: z.enum(statusValues as [string, ...string[]]),
    responsible: z.enum(responsibleValues as [string, ...string[]]),
    rules: z.array(
      z.object({
        type: z.string().refine(
          (t) => SERVER_RULES.some((r) => r.id === t),
          "Tipo de regra inválido",
        ),
        config: z.record(z.string(), z.unknown()),
      }),
    ).optional().default([]).refine(
      (rules) => new Set(rules.map((r) => r.type)).size === rules.length,
      "Não podem existir regras duplicadas",
    ),
    occurrences: z.array(occurrencePayloadSchema).min(1),
  });
}

export const patchOccurrenceSchema = z.object({
  description: z.string().min(1).optional(),
  startDate: dateLikeString.optional(),
  endDate: dateLikeString.optional(),
});

export const holidayPayloadSchema = z
  .object({
    label: z.string().min(1),
    startDate: dateLikeString,
    endDate: dateLikeString,
  })
  .refine((v) => new Date(v.endDate) > new Date(v.startDate), {
    message: "A data de fim deve ser posterior à data de início",
    path: ["endDate"],
  });
