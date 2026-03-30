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
	"Academico",
	"Administrativo",
	"Avaliacao",
	"Interservicos",
	"Comunicacao",
] as const;

export const EVENT_CLASSIFICATIONS = [
	"Obrigatorio",
	"Opcional",
	"Interno",
	"Externo",
] as const;

export const EVENT_STATUSES = [
	"Planeado",
	"Em progresso",
	"Concluido",
	"Cancelado",
] as const;

export const EVENT_RESPONSIBLES = [
	"Servicos Academicos",
	"Conselho Pedagogico",
	"Coordenacao",
	"Docente",
	"Secretaria",
] as const;

export const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];