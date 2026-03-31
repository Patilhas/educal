import type { TEventColor } from "@/features/calendar/types";

export const COLORS: TEventColor[] = [
	"blue",
	"green",
	"red",
	"yellow",
	"purple",
	"orange",
];

export const EVENT_CATEGORIES = [
	"TFM",
	"Candidaturas",
	"Matrículas e Inscrições",
] as const;

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