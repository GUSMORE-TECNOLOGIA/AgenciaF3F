# Equipe → usuários (login)

> **Template:** Em uso para outro projeto, substitua refs em [PROJECT_INTEGRATIONS.md](PROJECT_INTEGRATIONS.md) e `.env` pelos do novo projeto.

## Fluxo no app

Ao cadastrar um **Novo Membro** (Equipe → Novo Membro):

1. **Email obrigatório** — usado para criar o usuário de acesso.
2. O sistema chama a Edge Function `create-team-user`, que:
   - Cria usuário no **Auth** (Supabase) com senha padrão **123456**.
   - Insere em **`public.usuarios`** com `must_reset_password = true`.
3. Cria o **membro** em `equipe_membros` com `user_id` apontando para esse usuário.
4. No **primeiro login**, o usuário é redirecionado para **Alterar senha** e precisa definir uma nova senha (e confirmar).

**Alterar senha depois:** link **Alterar senha** no menu (sidebar). Mesma tela; mensagem adaptada se for primeiro acesso ou alteração voluntária.

## Edge Function `create-team-user`

- **Onde:** `supabase/functions/create-team-user/index.ts`
- **Deploy:** Supabase CLI (requer projeto linkado).

```bash
supabase link --project-ref <seu-project-ref>
supabase functions deploy create-team-user
```

Variáveis (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) são definidas automaticamente pelo projeto. A função só aceita requisições de usuários **admin** (checagem em `usuarios`).

## Script para membros já cadastrados (sem user_id)

Membros em `equipe_membros` que têm **email** mas **não** têm `user_id` podem ser vinculados a usuários via script:

```bash
npm run equipe:link-users -- --dry-run   # Listar membros que seriam processados
npm run equipe:link-users                # Criar Auth + usuarios e atualizar user_id
```

**.env:** `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

- Cria usuário no Auth (senha **123456**) e em `usuarios` (`must_reset_password = true`).
- Atualiza `equipe_membros.user_id` para o novo usuário.
- Se o email já existir no Auth, reaproveita o usuário e apenas faz upsert em `usuarios` e atualiza `user_id`.

Útil para os **11 membros** cadastrados manualmente sem usuário de login.

## Resumo

| Ação | Onde | Senha padrão |
|------|------|--------------|
| Novo Membro no app | Equipe → Novo Membro | 123456 |
| Script para já cadastrados | `npm run equipe:link-users` | 123456 |
| Alterar senha | Menu → Alterar senha ou primeiro login | — |
