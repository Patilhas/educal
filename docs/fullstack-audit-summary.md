# Educal — Resumo da Auditoria Full-Stack (Cliente e Servidor)

**Data:** 2026-04-12
**Foco:** Calendário Académico `educal-frontend`

Este documento consolida a análise da implementação global da aplicação, avaliando tanto a interface (Frontend/Cliente) como a arquitetura da infraestrutura (Backend/Servidor). Ele reflete o estado robusto a que o projeto chegou e os potenciais caminhos de escala.

---

## 1. Avaliação do Servidor (Backend)
Embora embutido num ambiente Next.js, o backend demonstra uma maturidade arquitetural que separa de forma clara responsabilidades (Layered Architecture).

### 1.1) Pontos Fortes e o que está bem
- **Camada de Abstração 3-Tier:**
  - *Rotas (`app/api/`)*: Apenas direcionam o tráfego HTTP.
  - *Controladores (`calendar.controller.ts`)*: Tratam do parsing de HTTP, garantem o wrap de `try/catch` e emitem Respostas standard (`api-response.ts`).
  - *Serviço (`calendar.service.ts`)*: Contém toda a lógica de negócio (ex: validação `startDate < endDate`, garantir um `user` base, emissão de `DomainError`).
  - *Acesso a Dados (`calendar.data.ts`)*: Camada de persistência puramente isolada.
- **Base de Dados Mockada (`calendar.data.ts`):** Em vez de manter a data apenas em memória volátil, criou-se um impressionante sistema _file-based_ que guarda os eventos numa cache JSON. Mais ainda, implementa um engenhoso **sistema de fila de gravação (`writeQueue`)**, prevenindo colapsos em _race conditions_ caso dois utilizadores gravem eventos ao mesmo tempo.
- **Validação Strítrica:** O uso exaustivo do `zod` em `schemas.ts` não deixa payloads corrompidos contaminarem o sistema.

### 1.2) Possíveis Melhorias (Backend)
- **Migração de Persistência (Performance):** A base de dados lê integralmente o ficheiro `calendar-db.json` para memória. Sendo um protótipo, isto é excelente. Contudo, ao fim de 5 anos de histórico este JSON será gigante. O próximo passo de escala natural será trocar as funções da classe `CalendarData` por um ORM (como Prisma ou Drizzle) acoplado a uma Base de Dados PostgreSQL ou SQLite, sem sequer precisar de mexer nas camadas adjacentes!

---

## 2. Avaliação do Cliente (Frontend)
O cliente é uma ramificação pesada focada na navegação temporal que consome o contexto sem demoras.

### 2.1) Pontos Fortes e o que está bem
- **Divisão em Features (`features/calendar`):** Manter tudo fechado no escopo "calendário" em vez de espalhar lógicas nos `components/` globais foi a decisão certa. Evita poluir outras partes da app que possam nascer futuramente.
- **Extração DRY de vistas:** As Vistas Diária e Semanal partilham os eixos temporais (ex: `time-grid-day-slots`), acabando com a duplicação insustentável. O formulário modal também dividiu a carga processual num ficheiro utilitário `add-edit-event-dialog-utils.ts`.
- **Tema Seguro:** As classes defeituosas originárias de templates antigos (`text-t-*`) não existem mais. Toda a UI se guia estritamente debaixo da alçada confiável dos atributos ShadCN e core variables (`bg-secondary`, `text-muted-foreground`, etc).

### 2.2) Possíveis Melhorias (Frontend)
Ao escalar, surgirão duas prioridades de otimização de Performance:
1. **O problema emergente de "Overfetching":** O componente principal (`calendar.tsx`) faz `await getEvents()` enviando todos os eventos do estabelecimento educativo de uma assentada para o `CalendarProvider`. Com histórico, este payload pode engasgar o arranque (SSR).
   - **Solução Futura:** A vista atual (que sabe sempre em que mês está alocada) ditará ao Provider um pedido fracionado (`start=2026-01-01&end=2026-03-31`).
2. **Atualizações de UI Optimista (Optimistic Updates):** Adotar gestores como _React Query_ (`@tanstack/react-query`) era um bónus espetacular. Ele permite renderizar a inserção do evento no ecrã _antes sequer_ da resposta do backend ditar sucesso no `fetch`, disfarçando qualquer lentidão na rede!

---

## 3. Estado de Resolução Geral do Frontend (Herdado/Atualizado)
Até à data, a dívida técnica foi saneada com tremendo sucesso. O código é altamente determinístico onde precisa.

✅ **Filtros cumulativos resolutos** (filtra por data X e utilizador Y organicamente).
✅ **Mutações protegidas** (métodos `.sort()` estão blindados e já não afetam as Props originais acidentais por ausência de clone).
✅ **Sem falsos botões perigosos** (Eventos têm Confirmação modal _inbuilt_ contra eliminações acidentais).
✅ **Visual coerente** do Drag and drop em conjunto com o código idiomático em Português.

---

## 4. Veredicto Final

Como Engenheiro, concordo profundamente com a Direção da Arquitetura levada a cabo! 
A modelização da stack "API Controller + Service -> Feature React Provider" garante coesão alta. O vosso design isolou perfeitamente os perigos.
O _Next step_ passará apenas por implementar uma cache de data no Cliente e uma persistência rígida (SQL DB) no lado Servidor caso a universidade/instituição pretendam escalar isto com tráfego denso.
Excelente base de trabalho!
