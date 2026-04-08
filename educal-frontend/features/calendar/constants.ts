import type { TEventColor } from "@/features/calendar/types";

export const EVENT_CATEGORIES = {
	TFM: {
		label: "TFM",
		color: "purple",
	},
	CANDIDATURAS: {
		label: "Candidaturas",
		color: "blue",
	},
	MATRICULAS_INSCRICOES: {
		label: "Matrículas e Inscrições",
		color: "green",
	},
} as const satisfies Record<string, { label: string; color: TEventColor }>;

export const EVENT_CATEGORY_KEYS = Object.keys(EVENT_CATEGORIES) as [
	keyof typeof EVENT_CATEGORIES,
	...(keyof typeof EVENT_CATEGORIES)[],
];

export const EVENT_CLASSIFICATIONS = [
	"Planeamento",
	"Verificação",
	"Execução",
	"Melhoria",
] as const;

export const EVENT_STATUSES = [
	"Feito",
	"Por fazer",
	"A realizar este mês",
	"Em curso",
] as const;

export const EVENT_RESPONSIBLES = [
	"Servicos Academicos",
	"Conselho Pedagógico",
    "Conselho Técnico-Científico",
    "Direção",
    "Coordenadores de Curso",
] as const;

export const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];