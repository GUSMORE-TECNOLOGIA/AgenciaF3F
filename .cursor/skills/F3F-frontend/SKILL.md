---
name: F3F-frontend
description: Owns the F3F (AgenciaF3F) presentation layer. React, Vite, TypeScript, Tailwind, functional components. Use when creating or changing pages, routes, layouts, forms, styles, or integrating UI with Supabase. Uses standardized field components from F3F-componentes; does not define new reusable field components.
---

# F3F Frontend

Responsável pela camada de apresentação do F3F: páginas, componentes de tela, formulários, estilos e padrões de UI. Stack definida em [project-overview.md](.context/docs/project-overview.md).

## Stack (aprovada)

- **Framework:** React com **Vite**. **Linguagem:** TypeScript.
- **Roteamento:** React Router (rotas em `src/App.tsx` ou config de rotas).
- **UI Kit:** **shadcn/ui** (componentes copiáveis) + **Tailwind CSS**.
- **Estado:** React Context + Hooks (AuthContext, ModalContext, etc.); hooks por domínio (useClientes, useDashboard, etc.).
- **Cliente Supabase:** `@supabase/supabase-js` (acesso via `src/services/supabase.ts` e hooks).
- **Testes:** Jest + React Testing Library para componentes; E2E (Playwright) quando configurado.

## Quando usar esta skill

- Criar ou alterar **páginas**, **layouts** e **rotas** (React Router).
- Criar ou alterar **componentes de tela** que **usam** os componentes padronizados (não criar novos componentes reutilizáveis de campo – isso é da skill [F3F-componentes](.cursor/skills/F3F-componentes/SKILL.md)).
- Usar campos padronizados (CPF, telefone, data, moeda) conforme definido na skill **F3F-componentes** – ver [reference da skill Componentes](.cursor/skills/F3F-componentes/reference.md).
- Aplicar ou ajustar estilos com Tailwind; manter consistência de tema.
- Integrar dados do Supabase em componentes (hooks, chamadas aos services).
- Garantir acessibilidade (labels, foco, contraste) e responsividade.

## Regras de código

- **Componentes funcionais:** React com hooks; sem Server Components (projeto Vite/SPA).
- **Shadcn/UI:** Preferir componentes do shadcn (Card, Button, Dialog, Input) em `src/components/ui` ou onde estiverem instalados, antes de criar HTML/CSS puro.
- **Componentes de Campo:** Não criar inputs complexos (CPF, Data, Moeda) aqui. Usar os da skill **F3F-componentes**.
- **Data Fetching:** Hooks (useClientes, useDashboard, etc.) que chamam services; evitar `useEffect` para fetch quando houver hook dedicado.

## Componentes de formulário (campos padronizados)

Não definir nem criar aqui componentes de campo (CPF, telefone, data, moeda). **Usar sempre** os componentes registrados na skill [F3F-componentes](.cursor/skills/F3F-componentes/SKILL.md). Consultar o [reference da skill Componentes](.cursor/skills/F3F-componentes/reference.md) para qual componente usar. Se não houver componente para um tipo, acionar a skill Componentes antes de implementar em telas.

## Listagens (tabelas e filtros)

Quando o projeto tiver padrão centralizado de listagem (DataTable, BarraFiltrosPadrao, useColunasPersistidas), usar **somente** esse padrão. Não montar `<table>` próprio nem filtro customizado sem alinhar ao padrão. Ver reference da skill Componentes § "Listas e filtros" e [.context/docs](.context/docs/) se existir requisito de listas.

## Estrutura de pastas (referência)

- `src/pages/` – Páginas por área (clientes, atendimento, configuracoes, auth, etc.); cada área pode ter `components/` locais.
- `src/components/` – Componentes compartilhados (layout, auth, UI).
- `src/hooks/` – Hooks compartilhados (useClientes, useAuth, etc.).
- `src/services/` – Acesso a dados e Supabase; esta skill consome, não implementa a lógica de negócio pesada.
- `src/contexts/` – Contextos React (Auth, Modal).

## Integração com outras skills

- **Banco/RLS:** esta skill não define tabelas nem RLS; consome dados via tipos gerados e services (Supabase / Backend).
- **Auth (F3F-auth-rotas):** proteção de rotas e sessão; esta skill usa o que Auth expõe (AuthContext, ProtectedRoute, redirect de login).
- **Backend (F3F-backend):** serviços ficam na camada de aplicação; o frontend chama via hooks ou services.

## Referência adicional

- **Componentes padronizados:** skill [F3F-componentes](.cursor/skills/F3F-componentes/SKILL.md) e seu [reference](.cursor/skills/F3F-componentes/reference.md).
- Convenções de componentes e tema Tailwind: [reference.md](reference.md) (neste diretório).
- Stack do projeto: [project-overview.md](.context/docs/project-overview.md).
