import { z } from "zod";

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
  category: z.string().min(1, "Selecione uma categoria"),
  classification: z.string().min(1, "Selecione uma classificação"),
  status: z.string().min(1, "Selecione um estado"),
  responsible: z.string().min(1, "Selecione um responsável"),
  occurrences: z
	.array(occurrenceSchema)
  .min(1, "Pelo menos uma ocorrência é obrigatória"),
});

export type TEventFormData = z.infer<typeof eventSchema>;
