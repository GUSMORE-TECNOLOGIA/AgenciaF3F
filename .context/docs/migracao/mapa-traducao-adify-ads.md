# Mapa de tradução: ADIFY (legado) → F3F módulo Ads (`/ads`)

Documento gerado no âmbito da incorporação do projeto **ADIFY** (Lovable) no **AgenciaF3F**, rota base `/ads`.  
Skills: **F3F-migracao-legado**, **F3F-novo-modulo**, **F3F-integracoes-vinculos**.

## Decisões

- **Um único Supabase (F3F):** auth, RLS e Edge Functions passam a viver no projeto já ligado ao AgenciaF3F.
- **Nomes de tabelas:** manter `meta_connections`, `publish_jobs`, `message_templates` (sem prefixo `ads_`) para reduzir diferença em relação ao código das Edge Functions legadas.
- **Não replicar** a tabela `profiles` do ADIFY; perfil/nome seguem `usuarios` + Supabase Auth do F3F.
- **Não migrar** a migration ADIFY que continha token Meta em SQL (vazamento); dados sensíveis só via OAuth e secrets.

## Tabela De → Para

| Origem (ADIFY) | Destino (F3F) |
|----------------|---------------|
| `profiles` | Não criar; usar `usuarios` existente. |
| `meta_connections` | Mesma tabela no Supabase F3F; RLS `auth.uid() = user_id`. |
| `publish_jobs` | Idem. |
| `message_templates` | Idem; FK `user_id` → `auth.users`. |
| `AuthContext` / `ProtectedRoute` | Removidos no destino; `AuthContext` F3F + `ModuleGuard modulo="ads"`. |
| Rotas `/`, `/settings`, `/auth/meta/callback` | `/ads`, `/ads/configuracoes`, `/ads/auth/meta/callback`. |
| Cliente `@/integrations/supabase/client` | `@/services/supabase`. |
| `src/lib/meta-api.ts` | `src/modules/ads/services/metaApi.ts` + `config.ts` (redirect OAuth). |
| `src/lib/naming.ts` | `src/modules/ads/lib/naming.ts`. |
| UI shadcn em `src/components/ui` | `src/modules/ads/ui` (isolado do restante do F3F). |
| Edge Functions `meta-*` | `supabase/functions/meta-*` no repositório F3F; secrets no Dashboard. |
| App ID / redirect Meta hardcoded | `META_APP_ID`, `META_OAUTH_REDIRECT_URI` (Edge); `VITE_ADS_META_REDIRECT_URI` (front). |

## Pós-implementação (operacional)

1. Aplicar migrations no projeto Supabase F3F.
2. Definir secrets: `META_APP_SECRET`, `META_APP_ID`, `META_OAUTH_REDIRECT_URI` (alinhado ao domínio de produção).
3. No Meta for Developers: adicionar **Valid OAuth Redirect URIs** com `…/ads/auth/meta/callback`.
4. Opcional (hardening): revisar `verify_jwt` por função e reduzir funções públicas sem JWT.

## Referências no repositório

- Rotas: [src/App.tsx](file:///C:/Projetos/AgenciaF3F/src/App.tsx)
- Módulo front: `src/modules/ads/`
- Migrations Ads: `supabase/migrations/*ads*`
- Integrações: [PROJECT_INTEGRATIONS.md](../PROJECT_INTEGRATIONS.md)
