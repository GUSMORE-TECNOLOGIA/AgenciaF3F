# ADR — Estratégia de deduplicação de UI do módulo Ads

## Status
Em execução (2026-04-07)

## Contexto
O projeto mantém componentes em `src/components/ui` e também em `src/modules/ads/ui`.
Essa duplicação aumenta custo de manutenção e risco de divergência visual/comportamental.

## Decisão
Executar deduplicação **incremental por ondas**, sem big-bang:

1. Preservar funcionamento atual do módulo.
2. Priorizar componentes mais usados em rotas críticas.
3. Migrar importações em PRs pequenos e verificáveis.

## Ondas sugeridas
1. Base: `button`, `input`, `label`, `card`, `separator`.
2. Formulário: `select`, `radio-group`, `checkbox`, `textarea`.
3. Feedback/overlay: `dialog`, `alert-dialog`, `toast/sonner`.
4. Restante: componentes raros (`carousel`, `navigation-menu`, etc.).

## Critérios de aceitação por onda
- `npm run lint` e `npm run build` verdes.
- Sem regressão visual nas telas `/ads`, `/ads/configuracoes` e callback.
- Sem aumento relevante de bundle da rota Ads.
