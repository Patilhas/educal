import {
  EVENT_CATEGORY_KEYS,
  EVENT_CLASSIFICATIONS,
  EVENT_RESPONSIBLES,
  EVENT_STATUSES,
} from "@/features/calendar/constants";
import type { IEvent, IUser } from "@/features/calendar/interfaces";

export interface ICalendarDb {
  users: IUser[];
  events: IEvent[];
}

const USERS_SEED: IUser[] = [
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

const eventNames = [
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

const randomArrayItem = <T>(items: readonly T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

const generateEvents = (numberOfEvents: number): IEvent[] => {
  const result: IEvent[] = [];
  let currentId = 1;

  const now = new Date();
  const startRange = new Date(now);
  startRange.setDate(now.getDate() - 30);
  const endRange = new Date(now);
  endRange.setDate(now.getDate() + 30);

  const fixedOccurrenceStart = new Date(now.getTime() - 30 * 60000);
  const fixedOccurrenceEnd = new Date(now.getTime() + 30 * 60000);

  result.push({
    id: currentId++,
    name: randomArrayItem(eventNames),
    objective:
      "Garantir que a atividade anual e as suas ocorrencias ficam planeadas para o ano letivo.",
    daysBetweenOccurrences: (Math.floor(Math.random() * 90) + 1).toString(),
    category: randomArrayItem(EVENT_CATEGORY_KEYS),
    classification: randomArrayItem(EVENT_CLASSIFICATIONS),
    status: randomArrayItem(EVENT_STATUSES),
    responsible: randomArrayItem(EVENT_RESPONSIBLES),
    occurrences: [
      {
        id: crypto.randomUUID(),
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.",
        startDate: fixedOccurrenceStart.toISOString(),
        endDate: fixedOccurrenceEnd.toISOString(),
      },
    ],
    user: randomArrayItem(USERS_SEED),
  });

  for (let index = 0; index < numberOfEvents - 1; index++) {
    const isMultiDay = Math.random() < 0.1;

    const occurrenceStart = new Date(
      startRange.getTime() + Math.random() * (endRange.getTime() - startRange.getTime()),
    );
    occurrenceStart.setHours(
      8 + Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 60),
      0,
      0,
    );

    const occurrenceEnd = new Date(occurrenceStart);

    if (isMultiDay) {
      occurrenceEnd.setDate(occurrenceStart.getDate() + Math.floor(Math.random() * 4) + 1);
      occurrenceEnd.setHours(
        8 + Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 60),
        0,
        0,
      );
    } else {
      occurrenceEnd.setHours(
        occurrenceEnd.getHours() + Math.floor(Math.random() * 3) + 1,
      );
    }

    result.push({
      id: currentId++,
      name: randomArrayItem(eventNames),
      objective:
        "Executar e acompanhar uma etapa do planeamento academico com regras definidas.",
      daysBetweenOccurrences: (Math.floor(Math.random() * 120) + 1).toString(),
      category: randomArrayItem(EVENT_CATEGORY_KEYS),
      classification: randomArrayItem(EVENT_CLASSIFICATIONS),
      status: randomArrayItem(EVENT_STATUSES),
      responsible: randomArrayItem(EVENT_RESPONSIBLES),
      occurrences: [
        {
          id: crypto.randomUUID(),
          description:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.",
          startDate: occurrenceStart.toISOString(),
          endDate: occurrenceEnd.toISOString(),
        },
      ],
      user: randomArrayItem(USERS_SEED),
    });
  }

  return result;
};

export const buildCalendarSeed = (): ICalendarDb => {
  return {
    users: structuredClone(USERS_SEED),
    events: generateEvents(80),
  };
};

