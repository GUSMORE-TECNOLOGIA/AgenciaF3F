# PLAN — Melhorias do módulo Ads

## Objetivo
Aplicar melhorias de confiabilidade, segurança e manutenção no módulo Meta Ads.

## Escopo desta rodada

1. Corrigir atualização de estado pós-OAuth (`Meta conectado/desconectado`).
2. Endurecer funções Edge do fluxo Meta (CORS e contrato de erros).
3. Melhorar feedback de carregamento nas rotas Ads.
4. Formalizar política de acesso (admin-only) e evolução documental.
5. Iniciar organização da camada de domínio/repositório Ads.

## Fora de escopo imediato
- Reabertura de acesso do Ads para perfis não-admin.
- Migração completa de todos os componentes `src/modules/ads/ui` em uma única entrega.

## Responsáveis por skill
- F3F-debugger-erros / F3F-frontend: correção pós-OAuth.
- F3F-security-performance / F3F-backend: hardening das Edge Functions.
- F3F-entidades-centrais / F3F-supabase-data-engineer: política de acesso + migration.
- F3F-qa-tester: smoke e validações de regressão.
- F3F-documentacao: ADRs e atualização de índices.

## Critérios de pronto
- Fluxo OAuth atualiza status para conectado quando a conexão foi persistida.
- Erros das funções Meta possuem código e mensagem consistentes.
- Build e lint executados sem falhas.
- Documentação de acesso Ads e deduplicação UI registrada em ADR.

## Evolução 2026-04-07 — UX híbrido (stepper + abas)

### Blueprint aplicado
- Etapa 1 (**Setup**): conexão Meta, conta de anúncios, identidade e preset.
- Etapa 2 (**Campanha**): estrutura (ABO/CBO), campanha nova/existente, nomes e criativos (com abas internas).
- Etapa 3 (**Público**): seleção de público, orçamento e agendamento (com abas internas).
- Etapa 4 (**WhatsApp**): configurações FASE 3 (quando exigidas pelo preset).
- Etapa 5 (**Revisão**): validação, publicação, diagnóstico e logs.

### Contratos e integração
- `metaApi` passou a padronizar erros por etapa (`Etapa Setup`, `Etapa Campanha`, `Etapa Público`, `Etapa WhatsApp`, `Etapa Revisão/Publicação`).
- Edge Functions `meta-status` e `meta-oauth-callback` incluem `step: "setup"` nas respostas de erro/sucesso para rastreabilidade de fluxo.

### QA/Smoke adicionados
- `scripts/verify-ads-moduleguard.mjs` agora valida presença do fluxo híbrido (`useAdsPublishFlow`, stepper, abas e action bar).
- `scripts/ads-smoke.mjs` valida contrato de erro não autenticado do `meta-status` com `code=UNAUTHORIZED` e `step=setup`.
