# Calendar Visual Tokens

Este documento descreve os tokens/classe utilitária usados pelo calendário e a sua origem.

## Fonte principal por categoria

A categoria é definida em:
- `features/calendar/constants.ts` (`EVENT_CATEGORIES`)

Cada categoria tem:
- `label`
- `color` (`blue | green | red | yellow | purple | orange`)

A cor base é obtida com:
- `getEventColorByCategory()` em `features/calendar/helpers.ts`

## Mapeamentos visuais centralizados

As classes derivadas da cor ficam em `features/calendar/helpers.ts`:

- `getMonthEventColorClass(color, badgeVariant)`
  - usado para badges do mês (`dot` e `colored`)
- `getWeekEventColorClass(color, badgeVariant)`
  - usado para blocos da semana/dia (`dot` e `colored`)
- `getWeekDotFillClass(color)`
  - preenchimento do ponto SVG no modo `dot`
- `getBulletColorClass(color)`
  - ponto pequeno (`EventBullet`)
- `getColorClass(color)`
  - variação colorida para itens de agenda/listas
- `getBgColor(color)`
  - fallback do avatar na agenda
- `getFilterDotColorClass(color)`
  - círculo de cor no dropdown de filtros

## Tokens semânticos de UI

Alguns componentes ainda usam classes semânticas do tema, por exemplo:
- `text-t-primary`
- `text-t-secondary`
- `text-t-tertiary`
- `text-t-quaternary`
- `text-t-quinary`
- `bg-bg-secondary`
- `border-b-tertiary`

Esses tokens devem estar definidos na camada de tema global do projeto.

## Componentes que consomem tokens por categoria

- `features/calendar/views/month-view/month-event-badge.tsx`
- `features/calendar/views/week-and-day-view/event-block.tsx`
- `features/calendar/views/month-view/event-bullet.tsx`
- `features/calendar/views/agenda-view/agenda-events.tsx`
- `features/calendar/header/filter.tsx`
- `features/calendar/dialogs/events-list-dialog.tsx`

## Regras de manutenção

1. Não criar novos mapas de cor locais em componentes.
2. Sempre derivar classes via helpers centrais.
3. Se surgir novo `TEventColor`, atualizar os mapas em `helpers.ts`.
4. Preservar consistência entre variantes `dot` e `colored`.

