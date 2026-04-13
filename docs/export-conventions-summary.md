# Convenção de Exports — Resumo e Análise

**Data:** 2026-04-12
**Foco:** Refatorização da tipologia de _Exports_ (Default vs Named) em `educal-frontend`

Com base nas regras estipuladas para a arquitetura:

> 1. _"If you only need to export a single value from a module, or if the module represents a main feature of your application, use export default."_
> 2. _"If you need to export multiple values from a module, or if you want to organize your code into smaller, reusable components, use export with named exports."_

Fiz uma análise transversal à codebase atual da pasta de domínio `features/calendar/`. Este sumário dita a auditoria ao estado atual baseando-se nestas duas regras e foca os potenciais pontos de conflito nas recentes alterações.

---

## 1. Estado Base e Conformidade

Originalmente, o template/projeto `educal` foi desenhado quase a 100% sob a premissa de **Named Exports**, independentemente da sua envergadura (por exemplo, `export function Calendar` em `calendar.tsx`). 
Isso viola claramente a **Regra 1**, visto que os componentes vitais do domínio exportam apenas um único valor e representam "Features" cruciais, justificando largamente o isolamento via `export default`.

### Componentes candidatos a mudar para `export default` (Regra 1):
*   **_Entrypoints_ e *Main Features*:** `calendar.tsx`, `calendar-body.tsx`, `settings.tsx`.
*   **Vistas Principais da App:** `calendar-month-view.tsx`, `calendar-week-view.tsx`, `calendar-day-view.tsx`, `calendar-year-view.tsx` e `agenda-events.tsx`.
*   **Módulos de Sistema/Diálogos:** `add-edit-event-dialog.tsx`, `delete-event-dialog.tsx`, `event-details-dialog.tsx`, `events-list-dialog.tsx`. (Representam as entidades massivas com responsabilidade única).

---

## 2. O Domínio das Named Exports (Regra 2)

A vossa codebase atual comporta-se formidavelmente no que atém à segunda regra, já agrupando dados em pequenas parcelas puras de _Named Exports_.

### Devem permanecer ou passar estritamente a `Named Exports` (Regra 2):
*   **Módulos Utilitários/Multivalor:** `helpers.ts`, `animations.ts`, `client-requests.ts`, `hooks.ts`, `schemas.ts` e `interfaces.ts`. Exportam inúmeras funções, _types_ ou blocos soltos.
*   **Contextos (Providers):** `calendar-context.tsx` e `dnd-context.tsx` porque tipicamente transportam o Provider, o Hook customizado (ex: `useCalendar`) e respetivas interfaces.
*   **Pequenos Componentes de UI Reutilizáveis (Smaller reusable components):** Peças agilizadas que constituem a UI, como `user-select.tsx`, `date-navigator.tsx`, `today-button.tsx`, `day-view-multi-day-events-row.tsx`.

---

## 3. Análise Crítica: Zona de Conflito das Vossas Alterações Atuais

Notei que, muito recentemente, vocês procederam à alteração para `export default` nos ficheiros:
*   `time-grid-day-slots.tsx`
*   `day-cell.tsx`
*   `draggable-event.tsx`
*   `event-block.tsx`
*   `month-event-badge.tsx`

**O Conflito Lógico:** 
Estes cinco ficheiros enquadram-se rigidamente na regra: **"export a single value from a module"** (tendo em conta que são um UI component solitário num ficheiro), pelo que mudar para default pareceria natural à primeira vista.
Porém, eles colidem frontalmente com a segunda regra: **"organize your code into smaller, reusable components, use export with named exports"**. Componentes como um "Selo de Mês" (`month-event-badge`), uma "Célula de Dia" (`day-cell`) e uma "Área Arrastável" (`draggable-event`) são puramente componentes de UI satélite atómicos. Não são uma "_Main Feature_".

### Recomendação de Melhoria / Reajuste
Em sistemas pesados com componentes puros de interface, a prioridade sobre o que define `Named` ou `Default` deve basear-se na **escala atómica** do ficheiro e não unicamente na sua quantia de exports isolada. Sugiro que adicionem este corolário ao sumário de conduta da equipa:

1. **_Default Exports_:** Usados apenas no Topo da Pirâmide. As Páginas (forçadas pelo Next.js), os _Containers_ Base (O `Calendar`), as Vistas Absolutas (`MonthView`, `WeekView`) e os Pop-ups de interface (`Modals` e `Dialogs`). Eles são as peças soberanas.
2. **_Named Exports_:** Usados para todo o alicerce e átomos visuais, por formarem "a base reutilizável". Todos os componentes satélite como o `DayCell`, `EventBlock`, `MonthEventBadge`, juntamente com os _helpers_ e hooks lógicos (`utils, types, constants`), ficam em funções nomeadas para facilitar o auto-completion sem ambiguidades e refatorizações automáticas no vosso IDE (e.g. o VSCode consegue renomear `EventBlock` em 10 lugares instantaneamente se for um _Named Export_ fixo).
