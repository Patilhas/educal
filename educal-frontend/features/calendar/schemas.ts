import { z } from "zod";
import {
  EVENT_CATEGORY_KEYS,
  EVENT_CLASSIFICATIONS,
  EVENT_RESPONSIBLES,
  EVENT_STATUSES,
} from "@/features/calendar/constants";

export const occurrenceSchema = z
  .object({
	id: z.string(),
	description: z.string().min(1, "A descrição da ocorrência é obrigatória"),
	startDate: z.date("A data de início da ocorrência é obrigatória"),
	endDate: z.date("A data de fim da ocorrência é obrigatória"),
  })
  .refine((occurrence) => occurrence.endDate > occurrence.startDate, {
	message: "A data de fim da ocorrência deve ser posterior à data de início",
	path: ["endDate"],
  });

export const eventSchema = z.object({
  name: z.string().min(1, "O nome do evento é obrigatório"),
  objective: z.string().min(1, "O objetivo é obrigatório"),
  daysBetweenOccurrences: z.string().regex(/^\d*$/, "Use apenas números"),
  category: z.enum(EVENT_CATEGORY_KEYS),
  classification: z.enum(EVENT_CLASSIFICATIONS),
  status: z.enum(EVENT_STATUSES),
  responsible: z.enum(EVENT_RESPONSIBLES),
  occurrences: z
	.array(occurrenceSchema)
  .min(1, "Pelo menos uma ocorrência é obrigatória"),
});

export type TEventFormData = z.infer<typeof eventSchema>;
