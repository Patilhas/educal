# Educal Frontend

Frontend do projeto Educal, construído com Next.js e com foco num calendário académico interativo.

## Stack
- Next.js (App Router)
- React + TypeScript
- shadcn/ui + Radix
- Tailwind CSS
- date-fns + framer-motion

## Funcionalidades principais
- vistas de calendário: agenda, dia, semana, mês e ano;
- criação, edição e eliminação de eventos;
- suporte a ocorrências multi-dia;
- drag and drop / resize de eventos;
- filtros por categoria e utilizador;
- tema claro/escuro e opções de visualização.

## Scripts
```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

## Estrutura relevante
- `app/`: entry points da aplicação
- `features/calendar/`: domínio do calendário
- `components/ui/`: componentes base reutilizáveis
