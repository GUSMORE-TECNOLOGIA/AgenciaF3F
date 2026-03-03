# Financeiro Premium por Cliente

## Objetivo
Transformar a aba `Financeiro` do cliente na visão financeira oficial por cliente, com geração de lançamentos individual e em lote, mantendo vínculo com plano ativo e contrato ativo opcional.

## Regras funcionais
- A aba do cliente exibe todos os lançamentos financeiros do cliente (receitas e despesas).
- Geração individual:
  - Origem `plano`: exige plano ativo do cliente.
  - Origem `avulso`: não exige plano.
  - Contrato é opcional, mas quando informado deve estar ativo.
- Geração em lote:
  - Entrada: período (`data_inicio`, `data_fim`), `dia_vencimento`, `status`, `valor`, `categoria`, `descricao_base`, origem (`plano` ou `avulso`).
  - Gera competências mensais no intervalo.
  - Se o dia não existir no mês, usa o último dia do mês.
- Vínculo:
  - Quando origem é plano, lançamento salva `cliente_plano_id` no `metadata`.
  - Quando houver contrato, salva `contrato_id` no `metadata`.

## Contrato de integração Serviços -> Financeiro
- Fonte oficial de elegibilidade: `get_financeiro_fontes_cliente(cliente_id)`.
- A função retorna apenas:
  - `cliente_planos` ativos do cliente;
  - vínculo opcional com `cliente_contratos` ativos (não cancelados).
- A geração financeira deve usar somente fontes dessa função.

## Idempotência (lote)
- Chave lógica por competência:
  - `cliente_id`
  - `categoria`
  - `metadata.origem = "geracao_lote"`
  - `metadata.mes_competencia`
  - `metadata.cliente_plano_id` (quando origem plano) ou `metadata.origem_ref = "avulso"`
- Se já existir lançamento com a mesma chave, a competência é ignorada.

## Metadados padrão em transações geradas
- Individual:
  - `origem: "manual_individual"`
  - `origem_ref: "plano" | "avulso"`
  - `cliente_plano_id` (quando plano)
  - `contrato_id` (quando informado)
- Lote:
  - `origem: "geracao_lote"`
  - `origem_ref: "plano" | "avulso"`
  - `mes_competencia: "YYYY-MM"`
  - `dia_vencimento`
  - `cliente_plano_id` (quando plano)
  - `contrato_id` (quando informado)

## Checklist operacional
- Validar se o perfil do usuário possui permissão de edição em `financeiro`.
- Confirmar se os planos listados na geração estão ativos.
- Confirmar se os contratos listados na geração estão ativos.
- Revisar prévia de competências antes de confirmar lote.
- Validar resultado da geração:
  - criados
  - ignorados por idempotência
  - consistência de valores e vencimentos
