# EduCal

**Aplicação de planeamento académico** — substitui o processo manual, baseado em folhas de cálculo, usado para gerir o calendário académico institucional (candidaturas, matrículas, exames e respetivos prazos), com migração automática entre anos letivos e validação contra regras institucionais configuráveis.

Projeto de Licenciatura em Engenharia Informática, Redes e Telecomunicações — ISEL. Documentação completa em [`docs/reports/FinalReport/relatorio.pdf`](docs/reports/FinalReport/relatorio.pdf).

---

## Funcionalidades

- **Gestão de eventos hierárquica** — cada objetivo académico agrega uma ou mais ocorrências datadas, com categoria, classificação, estado e responsável.
- **Motor de Migração** — transfere o calendário de um ano letivo para o seguinte de forma idempotente, com ajuste automático de datas (incluindo o caso de 29 de fevereiro).
- **Motor de Regras de Negócio** — valida eventos contra fins de semana, feriados nacionais, períodos de férias e intervalos mínimos configuráveis, sinalizando violações para revisão manual.
- **Calendário interativo** — vistas de Agenda, Dia, Semana, Mês e Ano, com drag-and-drop e redimensionamento de ocorrências.
- **Autenticação e controlo de acesso** — três papéis (Visualizador, Editor, Administrador), sessões seguras e gestão de utilizadores.
- **Notificações in-app** — aviso de ocorrências próximas com prazo de aviso configurável por evento/ocorrência.

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui + Radix · react-hook-form · framer-motion |
| Backend | Next.js API Routes · Zod · scrypt (Node `crypto`) |
| Dados | PostgreSQL + Drizzle ORM (produção) · Upstash Redis (demonstração/desenvolvimento) — camada de dados intercambiável |
| Testes | Vitest |

## Começar

### Pré-requisitos
- Node.js ≥ 20.9 (requerido pelo Next.js 16)
- [pnpm](https://pnpm.io/)
- Uma base de dados PostgreSQL (local ou remota) **ou** uma conta Upstash Redis — ver [camada de dados](#camada-de-dados)

### Instalação

```bash
pnpm install
cp .env.example .env.local
```

Preenche o `.env.local` com as variáveis relevantes (ver `.env.example`); no mínimo, `DATABASE_URL` se usares PostgreSQL, ou as três variáveis `UPSTASH_REDIS_*` se usares Redis.

### Camada de dados

A variável `DATA_LAYER` escolhe a implementação: qualquer valor diferente de `"redis"` (incluindo a variável não definida) resolve para PostgreSQL.

**PostgreSQL:**
```bash
pnpm db:generate                        # gera as migrations a partir do schema Drizzle
pnpm db:migrate                         # aplica as migrations
pnpm db:seed -- --target=postgres       # popula tabelas de referência e 3 utilizadores de demonstração
```

**Redis:**
```bash
pnpm db:seed -- --target=redis          # popula os mesmos dados de demonstração num blob Redis
```
Basta definir `DATA_LAYER="redis"` e as credenciais Upstash — não requer servidor de base de dados provisionado.

Em ambos os casos, o seed cria três utilizadores de demonstração (`daniel@educal.local` / admin, `filipe@educal.local` / editor, `sandra@educal.local` / viewer), todos com a password `Password123!`.

### Executar

```bash
pnpm dev
```

Aplicação disponível em [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descrição |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento (Turbopack) |
| `pnpm build` / `pnpm start` | Build e execução em produção |
| `pnpm typecheck` | Verificação de tipos (`tsc --noEmit`) |
| `pnpm lint` / `pnpm format` | ESLint / Prettier |
| `pnpm test` / `pnpm test:watch` / `pnpm test:coverage` | Testes (Vitest) |
| `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:truncate` | Gestão do schema e dados (Drizzle) |

## Estrutura do projeto

```
app/                  rotas Next.js (páginas + API routes), camada fina
features/             UI organizada por domínio (calendar, auth, admin-users, notifications)
components/ui/        primitivas de UI reutilizáveis (shadcn/ui)
server/               backend: auth, calendar, notifications — cada um em Controller/Service/Data
db/                    schema Drizzle, migrations e scripts de seed/truncate
shared/               tipos, schemas Zod e lógica partilhados entre cliente e servidor
i18n/                 dicionários de tradução
docs/reports/         relatório final do projeto (LaTeX + PDF)
```
