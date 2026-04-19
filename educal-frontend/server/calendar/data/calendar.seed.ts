import type { IEvent } from "@/features/calendar/interfaces";
import type {
  ICategory,
  IClassification,
  IResponsible,
  IStatus,
} from "@/features/calendar/interfaces";
import { AUTH_PUBLIC_USERS_SEED } from "@/server/auth/data/auth.seed";

export interface ICalendarDb {
  events: IEvent[];
  categories: ICategory[];
  classifications: IClassification[];
  statuses: IStatus[];
  responsibles: IResponsible[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Reference data — these represent DB table rows, not code constants.
// When a real DB exists, replace this with seeded rows.
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES_SEED: ICategory[] = [
  { value: "TFM", color: "purple" },
  { value: "CANDIDATURAS", color: "blue" },
  { value: "MATRICULAS_INSCRICOES", color: "green" },
];

const CLASSIFICATIONS_SEED: IClassification[] = [
  { value: "PLANEAMENTO" },
  { value: "VERIFICACAO" },
  { value: "EXECUCAO" },
  { value: "MELHORIA" },
];

const STATUSES_SEED: IStatus[] = [
  { name: "FEITO" },
  { name: "POR_FAZER" },
  { name: "A_REALIZAR" },
  { name: "EM_CURSO" },
];

const RESPONSIBLES_SEED: IResponsible[] = [
  { value: "SERVICOS_ACADEMICOS" },
  { value: "CONSELHO_PEDAGOGICO" },
  { value: "CONSELHO_TECNICO_CIENTIFICO" },
  { value: "DIRECAO" },
  { value: "COORDENADORES_CURSO" },
];

// ─────────────────────────────────────────────────────────────────────────────

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

const OCCURRENCE_DESCRIPTION =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.";

const EVENT_OBJECTIVES = [
  "Garantir que a atividade anual e as suas ocorrencias ficam planeadas para o ano letivo.",
  "Executar e acompanhar uma etapa do planeamento academico com regras definidas.",
];

const createOccurrence = (startDate: Date, endDate: Date): IEvent["occurrences"][number] => {
  return {
    id: crypto.randomUUID(),
    description: OCCURRENCE_DESCRIPTION,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

const createRandomOccurrence = (startRange: Date, endRange: Date): IEvent["occurrences"][number] => {
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
  const isMultiDay = Math.random() < 0.1;

  if (isMultiDay) {
    occurrenceEnd.setDate(occurrenceStart.getDate() + Math.floor(Math.random() * 3) + 1);
    occurrenceEnd.setHours(
      8 + Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 60),
      0,
      0,
    );
  } else {
    occurrenceEnd.setHours(occurrenceEnd.getHours() + Math.floor(Math.random() * 3) + 1);
  }

  return createOccurrence(occurrenceStart, occurrenceEnd);
};

const createEvent = (
  id: number,
  occurrences: IEvent["occurrences"],
): IEvent => {
  return {
    id,
    name: randomArrayItem(eventNames),
    objective: randomArrayItem(EVENT_OBJECTIVES),
    daysBetweenOccurrences: (Math.floor(Math.random() * 120) + 1).toString(),
    category: randomArrayItem(CATEGORIES_SEED).value,
    classification: randomArrayItem(CLASSIFICATIONS_SEED).value,
    status: randomArrayItem(STATUSES_SEED).name,
    responsible: randomArrayItem(RESPONSIBLES_SEED).value,
    occurrences,
    user: randomArrayItem(AUTH_PUBLIC_USERS_SEED),
  };
};

const generateEvents = (totalOccurrencesTarget: number): IEvent[] => {
  if (totalOccurrencesTarget <= 0) {
    return [];
  }

  const result: IEvent[] = [];
  let currentId = 1;
  let generatedOccurrences = 0;

  const now = new Date();
  const startRange = new Date(now);
  startRange.setDate(now.getDate() - 30);
  const endRange = new Date(now);
  endRange.setDate(now.getDate() + 30);

  const fixedOccurrenceStart = new Date(now.getTime() - 30 * 60000);
  const fixedOccurrenceEnd = new Date(now.getTime() + 30 * 60000);

  const firstEventOccurrences: IEvent["occurrences"] = [
    createOccurrence(fixedOccurrenceStart, fixedOccurrenceEnd),
  ];
  generatedOccurrences += 1;

  if (generatedOccurrences < totalOccurrencesTarget && Math.random() < 0.5) {
    firstEventOccurrences.push(createRandomOccurrence(startRange, endRange));
    generatedOccurrences += 1;
  }

  result.push(createEvent(currentId++, firstEventOccurrences));

  while (generatedOccurrences < totalOccurrencesTarget) {
    const remainingOccurrences = totalOccurrencesTarget - generatedOccurrences;
    const occurrencesCountForEvent = Math.min(
      remainingOccurrences,
      Math.random() < 0.5 ? 2 : 1,
    );

    const occurrences: IEvent["occurrences"] = Array.from(
      { length: occurrencesCountForEvent },
      () => createRandomOccurrence(startRange, endRange),
    );

    result.push(createEvent(currentId++, occurrences));
    generatedOccurrences += occurrencesCountForEvent;
  }

  return result;
};

export const buildCalendarSeed = (): ICalendarDb => {
  return {
    events: generateEvents(50),
    categories: structuredClone(CATEGORIES_SEED),
    classifications: structuredClone(CLASSIFICATIONS_SEED),
    statuses: structuredClone(STATUSES_SEED),
    responsibles: structuredClone(RESPONSIBLES_SEED),
  };
};
