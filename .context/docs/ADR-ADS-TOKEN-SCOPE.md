# ADR — Escopo de token Meta no módulo Ads

## Status
Aprovado (2026-04-07)

## Contexto
O módulo Ads hoje persiste token Meta em `public.meta_connections` por `user_id` e aplica RLS por `auth.uid() = user_id`.
Isso resolve o fluxo atual de publicação por usuário autenticado, mas existe discussão sobre futura evolução para escopo por organização/cliente.

## Decisão
Manter **escopo por `user_id`** nesta fase.

### Motivos
- Menor risco de regressão para o fluxo já em produção.
- Compatível com proteção de rota (`ModuleGuard`) e sessão Supabase atual.
- Menor superfície de autorização em Edge Functions durante endurecimento de JWT.
- Permite avançar com testes/smoke e hardening sem bloquear a entrega do módulo.

## Consequências
- Tokens não são compartilhados automaticamente entre usuários da mesma conta/cliente.
- Operação continua simples: conexão Meta é individual por usuário.
- Futuro suporte multi-tenant exigirá migração explícita de modelo e políticas.

## Plano de evolução (quando houver requisito de org/cliente)
1. Adicionar coluna de escopo (`org_id` ou `cliente_id`) sem remover `user_id`.
2. Introduzir chave única de negócio por escopo (ex.: `unique(org_id, provider)`).
3. Evoluir RLS para combinar `auth.uid()` com vínculo do usuário ao escopo.
4. Migrar Edge Functions para resolver token por escopo quando aplicável.
5. Migrar dados existentes com fallback seguro por usuário.
