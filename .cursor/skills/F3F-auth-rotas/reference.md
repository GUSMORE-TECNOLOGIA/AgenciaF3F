# Referência – F3F Auth e Rotas

Lições de projetos anteriores (problemas a evitar) e padrões para auth, perfis e rotas no F3F (Vite + React). **Registro progressivo:** ao definir estrutura de rotas, bypass E2E, cron ou contexto de tenant, documentar aqui.

---

## Problemas a evitar (lições de projetos anteriores)

Estes problemas já ocorreram em outros sistemas; a skill Auth e Rotas existe para **não repeti-los** no F3F.

### 1. Risco de vazamento de dados (multi-tenant ou por usuário)

- **Problema:** Uso de cliente Supabase com service role (admin) para dados que devem respeitar RLS pode expor dados de um usuário para outro.
- **Regra:** No frontend e em qualquer camada que sirva dados por usuário **nunca** usar cliente admin. Sempre usar o cliente com sessão (anon + JWT do usuário), que respeita RLS.
- **Padrão:** AuthContext (ou equivalente) fornece o usuário logado; services e hooks usam esse contexto e o cliente Supabase já autenticado com o JWT do usuário.

### 2. Rotas protegidas vs públicas e tratamento de auth

- **Problema:** Rotas que deveriam ser protegidas acessíveis sem login; comportamento inconsistente.
- **Regra:** Rotas protegidas devem ser envolvidas por um guard (ex.: ProtectedRoute) que verifica sessão (AuthContext); se não houver sessão, redirecionar para `/login`. Rotas públicas (ex.: `/login`) não exigem sessão.
- **Padrão:** No React Router, usar componente que lê AuthContext e, se não autenticado, redireciona com `<Navigate to="/login" />` (ou equivalente).

### 3. Redirects legados

- **Problema:** URLs antigas deixaram de funcionar após mudança de estrutura; links quebrados.
- **Regra:** Quando houver mudança de estrutura de URLs, manter redirect no React Router (ex.: rota antiga → `<Navigate to="/nova-rota" replace />`) até que links legados não sejam mais usados. Documentar aqui qual redirect legado existe.

### 4. Contexto de organização/tenant (org_id) – quando aplicável

- **Problema:** Usuário sem org_id (sem organização associada) acessando áreas que exigem org; comportamento indefinido.
- **Regra:** Se o projeto for multi-tenant com org_id: usuário sem org_id não pode acessar área autenticada, exceto ex.: tela de configuração. O guard redireciona quando não há org_id. Documentar no projeto quando esse modelo for adotado.

### 5. E2E e bypass de auth

- **Problema:** Testes E2E (ex.: Playwright) precisam acessar rotas protegidas sem sessão real.
- **Regra:** Pode-se aceitar um header controlado (ex.: `x-e2e-bypass-auth: 1`) **apenas em ambiente de teste** para simular usuário. Nunca habilitar em produção. Documentar o header e a condição (ex.: `import.meta.env.MODE === 'test'`) no reference quando adotado.

### 6. Cron e APIs internas

- **Problema:** Jobs/cron precisam chamar APIs internas sem sessão de usuário.
- **Regra:** Se houver `CRON_SECRET` (ou equivalente) definido, a API pode aceitar `Authorization: Bearer <CRON_SECRET>` e processar sem sessão de usuário. Documentar aqui quando implementado.

---

## Padrões de auth e rotas (resumo)

- **Login:** Supabase Auth; tela de login e logout; sessão disponível via AuthContext em todo o app.
- **Perfil:** dados do usuário (nome, email, roles, etc.) e vínculo com Configurações (acesso por módulo); um único usuário para todos os módulos; perfil define onde ele pode entrar.
- **Rotas protegidas:** ProtectedRoute (ou equivalente) redireciona não autenticado para login; rotas públicas acessíveis sem sessão.
- **Rotas públicas:** ex.: login, signup (se houver); listar exceções no reference quando definidas.
- **Contexto:** AuthContext em `src/contexts/` (ou onde o projeto definir) expõe user, session, loading; guards e telas consomem esse contexto.

---

## Registro progressivo

Preencher quando o projeto definir:

| Item | Status | Descrição |
|------|--------|------------|
| **Estrutura de rotas** | Definido | Ex.: `/` (home), `/login` (público), `/clientes`, `/atendimento` (protegidos). Proteção via ProtectedRoute + AuthContext. |
| **Redirects legados** | N/A | Nenhum redirect legado ativo; estrutura atual sem mudança de URLs antigas. |
| **Header ou cookie de org_id** | N/A | Projeto não é multi-tenant; sem org_id (ou documentar quando adotar). |
| **Bypass E2E** | A definir | Nome do header (ex.: x-e2e-bypass-auth) e condição quando testes E2E forem adotados. |
| **Cron / internal auth** | A definir | Nome do secret (ex.: CRON_SECRET) e como validar quando houver jobs. |

---

## Links

- [security.md](.context/docs/security.md) – políticas de auth e RLS.
- [project-overview.md](.context/docs/project-overview.md) – stack e objetivos.
- [data-flow.md](.context/docs/data-flow.md) – fluxo de auth e entidades.
