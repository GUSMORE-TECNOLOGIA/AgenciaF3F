---
name: F3F-auth-rotas
description: "Auth, profiles, users and routes in F3F (AgenciaF3F). Single login (Supabase Auth), session, user profile, route protection (React Router + AuthContext), protected/public routes. Use when creating or changing login, session, profile, or protected/public routes."
---

# F3F Auth e Rotas

Responsável por **autenticação**, **perfis**, **usuários** e **rotas** no F3F: login único (Supabase Auth), sessão, perfil do usuário, **proteção de rotas no cliente** (React Router + AuthContext/ProtectedRoute), rotas protegidas vs públicas e redirects. Stack: **Vite + React** (sem Next.js); referências em [project-overview.md](.context/docs/project-overview.md) e [security.md](.context/docs/security.md).

## Regra de ouro

- **Login e sessão** (Supabase Auth, tela de login, refresh) → esta skill.
- **Perfil do usuário** (dados do perfil, roles, acesso por módulo conforme Configurações) → esta skill.
- **Proteção de rotas** (quem acessa o quê no client-side: ProtectedRoute, redirect para login) → esta skill.
- **Rotas protegidas vs públicas** (quem acessa o quê, tratamento de não autenticado) → esta skill.
- **Configuração de rotas** (estrutura de paths; mudanças que afetam URLs) → esta skill, para não quebrar links.
- **Esquema e RLS** (tabelas de perfil no banco) → skill F3F-supabase-data-engineer; **telas** de perfil → skill F3F-frontend; esta skill define **o que** protege e **como** resolver usuário/perfil nas rotas (AuthContext, guards).

## Quando usar esta skill

- Criar ou alterar **telas de login**, **logout** ou **fluxo de sessão** (Supabase Auth).
- Definir ou alterar **perfil do usuário** (campos, roles, vínculo com Configurações para acesso por módulo).
- Configurar ou alterar **proteção de rotas** (React Router: ProtectedRoute, redirect para `/login` quando não autenticado).
- Definir **rotas públicas** vs **rotas protegidas**; onde o contexto de usuário é resolvido (ex.: AuthContext em `src/contexts/`).
- Adicionar **redirects legados** (URLs antigas → novas) ou alterar estrutura de paths que afeta URLs.
- Resolver **contexto da aplicação** (user_id, perfil) para uso nas telas e no backend (services nunca usam admin client para dados por usuário).
- Evitar ou corrigir **problemas conhecidos** com auth e rotas (ver [reference.md](reference.md)).

## Regras (Vite + React)

- **Sem middleware Next.js:** o F3F é SPA com React Router. Proteção é feita no cliente via componente ProtectedRoute (ou equivalente) que verifica sessão (AuthContext) e redireciona para login.
- **Cliente Supabase e dados por usuário:** no frontend e em qualquer chamada que represente “dados do usuário logado”, **nunca** usar cliente admin (service role); sempre usar o cliente com sessão (anon + JWT do usuário), que respeita RLS.
- **Rotas públicas vs protegidas:** rotas protegidas renderizam conteúdo apenas quando há sessão; caso contrário redirecionam para `/login`. Rotas públicas (ex.: `/login`) são acessíveis sem sessão. Listar exceções no reference quando definidas.
- **Contexto no cliente:** AuthContext (ou equivalente em `src/contexts/`) expõe usuário/sessão; usar para guards e para passar user_id aos services. Evitar refetch desnecessário a cada navegação (cache de perfil quando fizer sentido).
- **Registro progressivo:** padrões adotados (ex.: nome do cookie de org, header E2E, secret de cron) devem ser documentados no [reference.md](reference.md) para todo o projeto seguir.

## Conteúdo do reference.md

O [reference.md](reference.md) contém:

- **Problemas a evitar (lições de projetos anteriores):** admin client em dados por usuário, rotas públicas vs protegidas, redirects legados, E2E e cron.
- **Padrões de auth e rotas:** como resolver contexto (user_id, perfil), onde definir rotas públicas, exceções (signup, cron).
- **Registro progressivo:** quando o projeto definir algo (ex.: bypass E2E, cron secret), documentar ali.

## Integração com outras skills

- **F3F-supabase-data-engineer:** tabelas de perfil e RLS são da skill Supabase; esta skill usa a sessão e o user_id fornecidos pelo Supabase Auth e define como a aplicação obtém esse contexto (AuthContext).
- **F3F-backend:** services recebem user_id/perfil resolvidos pelo contexto do cliente (AuthContext); esta skill define como esse contexto é exposto ao app.
- **F3F-frontend:** telas de login e de perfil são implementadas pela Frontend; esta skill define proteção de rotas e redirects (ProtectedRoute, redirect para login).
- **Configurações (módulo):** perfil define **quem acessa qual módulo**; a resolução de "usuário X pode acessar módulo Y" pode ser feita nesta skill (guard ou helper) usando dados de Configurações.

## Referência adicional

- Problemas a evitar, padrões de rotas e auth, e registro progressivo: [reference.md](reference.md) (neste diretório).
