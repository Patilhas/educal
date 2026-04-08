import {
	EVENT_CATEGORY_KEYS,
	EVENT_CLASSIFICATIONS,
	EVENT_RESPONSIBLES,
	EVENT_STATUSES,
} from "@/features/calendar/constants";
import type { IEvent, IUser } from "@/features/calendar/interfaces";

export const USERS_MOCK: IUser[] = [
	{
		id: "f3b035ac-49f7-4e92-a715-35680bf63175",
		name: "Daniel Santos",
		picturePath: null,
	},
	{
		id: "3e36ea6e-78f3-40dd-ab8c-a6c737c3c422",
		name: "Filipe Freitas",
		picturePath: null,
	},
	{
		id: "a7aff6bd-a50a-4d6a-ab57-76f76bb27cf5",
		name: "Sandra Ferreira",
		picturePath: null,
	},
];

// ================================== //

const events = [
    "Reunião de Equipa e Vagas",
    "Proposta de Calendários",
    "Calendário Interno 1S/2S",
    "Pedido de Documentação UC",
    "Protocolos de Docentes Externos",
    "Publicações em Diário da República",
    "Verificação de Planos de Estudo",
    "Parametrização de ECTS e Horas",
    "Dados de Contratação Docente",
    "Parametrização de Pautas",
    "Inserção de Regências de UC",
    "Criação e Verificação de FUCs",
    "Marcação e Publicação de Salas",
    "Notificação de Datas de Inscrição",
    "Alertas no Portal Académico",
    "Divulgação e Redes Sociais",
    "Apoio às Inscrições",
    "Validação de Horários e Erros",
    "Dados de Turmas e Turnos",
    "Parametrização de Matrículas PG",
    "Inscrição em UCs e Máximos",
    "Verificação de Exceções de Inscrição",
    "Ajuste de Vagas em Optativas",
    "Apoio a Novos Alunos",
    "Verificação de Inscrições Irregulares",
    "Validação de Dados RAIDES",
    "Graduação e Diplomas",
    "Horários para Sumários",
    "Gestão de Ocupação de Salas",
    "Propostas e Prazos de TFM",
    "Constituição de Júris TFM",
    "Defesa e Notas de TFM",
    "Entrega de Versão Definitiva TFM",
    "Bolsas e Necessidades Especiais",
    "Atualização de Fichas de Docente",
    "Estatutos Especiais e Atletas",
    "Revisão de Guias de Trabalho",
    "Concursos Especiais e Mestrados",
    "Verificação de Pagamentos",
    "Instrução de Planos de Transição",
];

const mockGenerator = (numberOfEvents: number): IEvent[] => {
	const result: IEvent[] = [];
	let currentId = 1;

	const randomUser = USERS_MOCK[Math.floor(Math.random() * USERS_MOCK.length)];

	// Date range: 30 days before and after now
	const now = new Date();
	const startRange = new Date(now);
	startRange.setDate(now.getDate() - 30);
	const endRange = new Date(now);
	endRange.setDate(now.getDate() + 30);

	// Create an event happening now
	const occurrenceStart = new Date(now.getTime() - 30 * 60000);
	const occurrenceEnd = new Date(now.getTime() + 30 * 60000);
	
	const currentEvent = {
		id: currentId++,
		name: events[Math.floor(Math.random() * events.length)],
		objective:
			"Garantir que a atividade anual e as suas ocorrencias ficam planeadas para o ano letivo.",
		daysBetweenOccurrences: (Math.floor(Math.random() * 90) + 1).toString(),
		category:
			EVENT_CATEGORY_KEYS[Math.floor(Math.random() * EVENT_CATEGORY_KEYS.length)],
		classification:
			EVENT_CLASSIFICATIONS[
				Math.floor(Math.random() * EVENT_CLASSIFICATIONS.length)
			],
		status: EVENT_STATUSES[Math.floor(Math.random() * EVENT_STATUSES.length)],
		responsible:
			EVENT_RESPONSIBLES[Math.floor(Math.random() * EVENT_RESPONSIBLES.length)],
		occurrences: [
			{
				id: crypto.randomUUID(),
				description:
					"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.",
				startDate: occurrenceStart.toISOString(),
				endDate: occurrenceEnd.toISOString(),
			},
		],
		user: randomUser,
	};

	result.push(currentEvent);

	// Generate the remaining events
	for (let i = 0; i < numberOfEvents - 1; i++) {
		// Determine if this is a multi-day event (10% chance)
		const isMultiDay = Math.random() < 0.1;

		const occurrenceStart = new Date(
			startRange.getTime() +
			Math.random() * (endRange.getTime() - startRange.getTime()),
		);

		// Set time between 8 AM and 8 PM
		occurrenceStart.setHours(
			8 + Math.floor(Math.random() * 12),
			Math.floor(Math.random() * 60),
			0,
			0,
		);

		const occurrenceEnd = new Date(occurrenceStart);

		if (isMultiDay) {
			// Multi-day event: Add 1-4 days
			const additionalDays = Math.floor(Math.random() * 4) + 1;
			occurrenceEnd.setDate(occurrenceStart.getDate() + additionalDays);
			occurrenceEnd.setHours(
				8 + Math.floor(Math.random() * 12),
				Math.floor(Math.random() * 60),
				0,
				0,
			);
		} else {
			// Same-day event: Add 1-3 hours
			occurrenceEnd.setHours(occurrenceEnd.getHours() + Math.floor(Math.random() * 3) + 1);
		}

		result.push({
			id: currentId++,
			name: events[Math.floor(Math.random() * events.length)],
			objective:
				"Executar e acompanhar uma etapa do planeamento academico com regras definidas.",
			daysBetweenOccurrences: (Math.floor(Math.random() * 120) + 1).toString(),
			category:
				EVENT_CATEGORY_KEYS[Math.floor(Math.random() * EVENT_CATEGORY_KEYS.length)],
			classification:
				EVENT_CLASSIFICATIONS[
					Math.floor(Math.random() * EVENT_CLASSIFICATIONS.length)
				],
			status: EVENT_STATUSES[Math.floor(Math.random() * EVENT_STATUSES.length)],
			responsible:
				EVENT_RESPONSIBLES[Math.floor(Math.random() * EVENT_RESPONSIBLES.length)],
			occurrences: [
				{
					id: crypto.randomUUID(),
					description:
						"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.",
					startDate: occurrenceStart.toISOString(),
					endDate: occurrenceEnd.toISOString(),
				},
			],
			user: USERS_MOCK[Math.floor(Math.random() * USERS_MOCK.length)],
		});
	}

	return result;
};

export const CALENDAR_ITEMS_MOCK: IEvent[] = mockGenerator(80);
