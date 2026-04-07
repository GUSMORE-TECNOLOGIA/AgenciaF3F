# Runbook — Deploy e validação do módulo Ads (Meta)

## 1) Secrets e variáveis

### Supabase (Edge Functions secrets)
Obrigatórias:
- `META_APP_ID`
- `META_APP_SECRET`
- `META_OAUTH_REDIRECT_URI`

Opcional/infra:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Vercel (frontend)
- `VITE_ADS_META_OAUTH_REDIRECT_URI` em `production` e `development`.
- Em `preview`, preferir vazio para usar fallback dinâmico por `window.location.origin`.

## 2) Redirect URI (consistência obrigatória)
Usar exatamente a mesma URL em:
1. Meta Developers (Valid OAuth Redirect URIs)
2. Supabase secret `META_OAUTH_REDIRECT_URI`
3. Vercel `VITE_ADS_META_OAUTH_REDIRECT_URI` (quando configurado)

Referência atual de produção:
- `https://ads.agenciaf3f.com.br/ads/auth/meta/callback`

## 3) Banco e migrations
1. Garantir migrations locais atualizadas em `supabase/migrations`.
2. Aplicar migrations no projeto Supabase.
3. Confirmar migrations remotas via listagem.

## 4) Edge Functions
Funções do módulo:
- `meta-login` (permite OAuth redirect; `verify_jwt=false`)
- Demais `meta-*` com `verify_jwt=true`

Checklist:
1. Publicar funções alteradas.
2. Verificar lista remota de funções.
3. Confirmar `verify_jwt` esperado por função.

## 5) Smoke pós-deploy
Executar:
- `node scripts/ads-smoke.mjs`
- `node scripts/verify-ads-moduleguard.mjs`

Esperado:
- `meta-login` retorna `302`.
- Endpoint protegido (ex.: `meta-ad-accounts`) sem sessão retorna `401`.
- Rota `/ads` permanece protegida por `ModuleGuard`.

## 6) Build/Lint local
Executar:
- `npm run lint`
- `npm run build`

Esperado:
- sem erros de lint
- build concluído e chunks de Ads carregados por lazy route

## 7) Rollback rápido
Se regressão:
1. Reverter commit das funções/config.
2. Re-publicar funções `meta-*`.
3. Restaurar variáveis/secret alteradas.
4. Reexecutar smoke checks.
