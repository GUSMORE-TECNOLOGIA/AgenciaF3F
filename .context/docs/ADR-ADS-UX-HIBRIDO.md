# ADR — UX híbrido do módulo Ads (stepper + abas)

## Status
Aprovado — 2026-04-07

## Contexto
O módulo Ads estava concentrado em um formulário único e longo, aumentando carga cognitiva, tempo de preenchimento e chance de erro. A operação exigia preservar o fluxo OAuth/Meta já estabilizado e manter o comportamento consistente entre localhost e produção.

## Decisão
Adotar arquitetura de UX híbrida no `PublishForm`:
- Stepper principal com 5 etapas (`setup`, `campaign`, `audience`, `fase3`, `review`).
- Abas internas nas etapas com maior densidade de campos (`campaign` e `audience`).
- Action bar fixa para navegação incremental (anterior/próximo).
- Resumo sticky lateral para contexto contínuo durante todo o preenchimento.

## Contratos técnicos associados
- Hook de orquestração de fluxo: `useAdsPublishFlow` (estado de etapa, regras de avanço e abas internas).
- Contrato de erro orientado por etapa em `metaApi` (`Etapa Setup/Campanha/Publico/WhatsApp/Revisao`).
- Edge Functions `meta-status` e `meta-oauth-callback` retornam `step=setup` para rastreabilidade.

## Consequências
### Positivas
- Menor fricção de uso com progresso visível.
- Melhor diagnóstico operacional por etapa.
- Menor risco de perda de contexto com resumo sticky.

### Trade-offs
- Maior complexidade de apresentação no frontend.
- Necessidade de manter critérios de avanço sincronizados com regras de validação/publish.

## Guardrails
- Não quebrar callback OAuth nem fallback de status já implementados.
- Manter smoke/guard scripts cobrindo as garantias mínimas de rota e fluxo.
- Preservar decisões de segurança e acesso (`ads` admin-only na fase atual).

