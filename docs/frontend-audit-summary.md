# Educal Frontend — Resumo da auditoria

**Data:** 2026-04-08

## 1) Contexto
O frontend em `educal-frontend` é um projeto Next.js com foco quase total num calendário académico. A app já não está no estado de template puro: a homepage renderiza diretamente o calendário, com várias vistas, filtros, CRUD visual, tema e interações de drag and drop.

Apesar disso, ainda há bastante dívida técnica e vários sinais de evolução incremental a partir de um template inicial.

### Estado de resolução (atualizado)
- ✅ 3.1 Filtros cumulativos (categoria + utilizador)
- ✅ 3.2 Mutação de arrays em helpers
- ✅ 3.3 Ordenação da agenda por categoria
- ✅ 3.4 Year view com ocorrências multi-dia
- ✅ 3.5 Extração de núcleo repetido day/week (coluna de horas + slots)
- ✅ 3.6 Centralização visual de categorias (mapeamentos removidos dos componentes principais)
- ✅ 3.7 `useCalendar()` com validação robusta de contexto
- ✅ 3.8 Texto PT/EN normalizado nos pontos principais da UI
- ✅ 3.9 README do template substituído por README do projeto
- ✅ 4 (Alta prioridade) Simplificação de `AddEditEventDialog` com extração de lógica para utilitários
- ✅ 4 (Alta prioridade) Documentação de tokens visuais em `educal-frontend/docs/calendar-visual-tokens.md`

---

## 2) Overview da UI e funcionalidades

### Estrutura geral
- `app/page.tsx` monta o calendário principal.
- `app/layout.tsx` aplica tema, fontes e estilos globais.
- `features/calendar/calendar.tsx` é o ponto de entrada da feature.
- `features/calendar/calendar-body.tsx` decide qual vista renderizar.

### Barra superior / header
O header do calendário inclui:
- botão de ir para hoje;
- navegação temporal anterior/seguinte;
- contagem de eventos no período;
- troca entre vistas (`agenda`, `day`, `week`, `month`, `year`);
- filtro por categoria;
- filtro por utilizador;
- botão para adicionar evento;
- definições do calendário.

### Vistas disponíveis
- **Month view**: grelha mensal com eventos em cada dia e indicação de overflow.
- **Week view**: grelha semanal por horas, com eventos horários e multi-dia.
- **Day view**: detalhe de um dia, com timeline e sidebar com mini calendário.
- **Year view**: 12 meses em grelha com marcação de eventos.
- **Agenda view**: lista pesquisável, agrupável por data ou categoria.

### Funcionalidades principais
- criação de eventos;
- edição de eventos;
- eliminação de eventos;
- multi-occurrence por evento;
- drag and drop;
- resize em eventos temporais;
- alternância de tema claro/escuro;
- alternância entre formato 12h e 24h;
- alternância de badge visual (`dot` / `colored`);
- agrupamento da agenda por data ou categoria.

---

## 3) Problemas encontrados

### 3.1 Filtros não são combináveis — **Resolvido**
O filtro por categoria e o filtro por utilizador vivem em estado separado, mas o resultado final é sobrescrito em vez de ser composto.

**Impacto:**
- filtrar por categoria e depois por utilizador não mantém os dois critérios ao mesmo tempo;
- comportamento pouco previsível para o utilizador.

### 3.2 Mutação de arrays em helpers — **Resolvido**
Há ordenações com `.sort()` sobre arrays recebidos por parâmetro em `features/calendar/helpers.ts`.

**Impacto:**
- pode quebrar memoization;
- explica o warning do React Compiler;
- pode introduzir efeitos laterais subtis.

### 3.3 Ordenação da agenda por categoria é frágil — **Resolvido**
Quando a agenda é agrupada por categoria, a ordenação atual assume que a chave é data.

**Impacto:**
- `NaN` na ordenação;
- grupos em ordem errada ou instável.

### 3.4 Year view não trata bem ocorrências multi-dia — **Resolvido**
A `year view` procura eventos apenas pela data de início.

**Impacto:**
- eventos multi-dia que “passam” por um dia não aparecem corretamente;
- perda de consistência entre vistas.

### 3.5 Duplicação excessiva entre vistas semana/dia — **Resolvido**
A `week view` e a `day view` repetem grande parte da estrutura:
- colunas de horas;
- zonas dropáveis;
- criação de eventos por slot;
- timeline atual;
- lógica de layout.

**Impacto:**
- manutenção mais difícil;
- correções têm de ser replicadas manualmente.

### 3.6 Duplicação de lógica visual por categoria — **Resolvido**
A cor da categoria e as classes visuais estão repetidas em vários componentes:
- `month-event-badge.tsx`
- `event-block.tsx`
- `event-bullet.tsx`
- `agenda-events.tsx`
- `day-cell.tsx`

**Impacto:**
- mudanças de design dispersas;
- risco de inconsistências visuais.

### 3.7 `useCalendar()` tem validação fraca
O contexto é criado com cast de objeto vazio, o que torna o erro de uso fora do provider pouco fiável.

**Estado:** Resolvido com `createContext<ICalendarContext | null>(null)` e guard explícito.

### 3.8 Conteúdo misto PT/EN
Há textos em português e inglês na mesma interface.

**Impacto:**
- sensação de produto incompleto;
- experiência menos coerente.

**Estado:** Resolvido nos pontos críticos de navegação e feedback.

### 3.9 Resíduos do template inicial
Ainda existem sinais do template original:
- `README.md` ainda descrevia “Next.js template”;
- parte dos estilos e tokens não está claramente documentada.

**Estado:** README resolvido; documentação de tokens continua pendente.

---

## 4) Melhorias recomendadas

### Alta prioridade
1. ~~Simplificar `AddEditEventDialog` (complexidade e responsabilidades misturadas).~~ **Concluído**
2. ~~Documentar tokens visuais usados pelo calendário.~~ **Concluído**

### Prioridade média
1. ~~Consolidar textos e mensagens PT em todos os diálogos menos usados.~~ **Resolvido** (Traduções verificadas).
2. ~~Rever estilos utilitários `text-t-*` / `bg-bg-*` e documentar origem.~~ **Resolvido** (Extintos, substituídos pelas _standard classes_ do Tailwind/ShadCN como `text-muted-foreground` / `bg-secondary` / `border-border`).
3. ~~Rever performance de renderização nas vistas com mais animação.~~ **Avaliado** (Framer Motion está a atuar dentro dos trâmites aceitáveis e a renderização otimizada graças às chaves).

### Prioridade baixa
1. ~~Tornar os mocks determinísticos para debug e testes.~~ **Ignorado** (Implementação revertida por ser _overkill_ face à persistência gerada pela cache `calendar-db.json` em protótipos em fase inicial sem rotinas destrutivas de testes E2E).
2. ~~Limpar eventuais ficheiros não usados, após verificação por import/search.~~ **Resolvido** (ex: o `DeleteEventDialog` estava órfão e foi corretamente implementado; ficheiros antigos verificados).

---

## 5) Categorias e cor
A estrutura de categorias já vai na direção certa, com chave → `{ label, color }` em `features/calendar/constants.ts`.

O problema não é tanto a estrutura em si, mas sim a sua utilização espalhada por múltiplos componentes e helpers.

**Recomendação prática:**
- usar `EVENT_CATEGORIES` como origem única;
- derivar label, cor e classes a partir dali;
- evitar manter mapeamentos paralelos em helpers diferentes.

---

## 6) Código duplicado / pontos a consolidar

### UI repetida
- badges coloridos em várias vistas;
- layout horário de day/week;
- blocos de eventos com lógica semelhante;
- helpers de cor e formatação.

### Lógica repetida
- parsing de datas;
- cálculo de intervalos e duração;
- filtros por data/intervalo;
- transformação `events -> occurrences`.

### Sugestão de consolidação
- criar um helper/component base para eventos categorizados;
- criar um componente partilhado para a grelha temporal;
- criar funções puras para filtros e ordenação.

---

## 7) Resumo do estado actual
O frontend já oferece uma experiência rica e relativamente avançada para um calendário académico, com várias vistas e interações úteis.

No entanto, a base ainda mostra sinais claros de protótipo evolucionado:
- lógica centralizada demais no contexto;
- complexidade elevada em alguns componentes de formulário;
- algumas inconsistências de modelação e apresentação.

---

## 8) Próximos passos recomendados
Se quiseres continuar de forma prática, a ordem ideal seria:
1. simplificar `AddEditEventDialog`;
2. documentar tokens/estilos do calendário;
3. estabilizar mocks para testes e debug;
4. só depois atacar refinamentos visuais.

---

## 9) Conclusão
A UI está funcional e já cobre o essencial do calendário, mas ainda precisa de limpeza estrutural para ficar mais robusta, previsível e fácil de manter.

Se quiseres, no próximo passo posso:
- começar a **corrigir o código** dos problemas mais importantes; ou
- fazer uma **segunda versão deste relatório** mais curta e executiva.
