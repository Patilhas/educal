import { z } from "zod";
import {
  EVENT_CATEGORY_KEYS,
  EVENT_CLASSIFICATIONS,
  EVENT_RESPONSIBLES,
  EVENT_STATUSES,
} from "@/features/calendar/constants";

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

export const baseEventPayloadSchema = z.object({
  name: z.string().min(1),
  objective: z.string().min(1),
  daysBetweenOccurrences: z.string().regex(/^\d*$/),
  category: z.enum(EVENT_CATEGORY_KEYS),
  classification: z.enum(EVENT_CLASSIFICATIONS),
  status: z.enum(EVENT_STATUSES),
  responsible: z.enum(EVENT_RESPONSIBLES),
  occurrences: z.array(occurrencePayloadSchema).min(1),
  userId: z.string().optional(),
});

export const createEventSchema = baseEventPayloadSchema;

export const updateEventSchema = baseEventPayloadSchema.extend({
  id: z.number().int().positive().optional(),
});

export const patchOccurrenceSchema = z.object({
  description: z.string().min(1).optional(),
  startDate: dateLikeString.optional(),
  endDate: dateLikeString.optional(),
});

export type TCreateEventPayload = z.infer<typeof createEventSchema>;
export type TUpdateEventPayload = z.infer<typeof updateEventSchema>;
export type TPatchOccurrencePayload = z.infer<typeof patchOccurrenceSchema>;

