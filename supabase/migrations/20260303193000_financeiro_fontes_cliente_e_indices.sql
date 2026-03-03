-- Financeiro premium por cliente:
-- 1) Fonte oficial de seleção de planos/contratos ativos para geração financeira
-- 2) Índices para listagem e idempotência por competência

CREATE OR REPLACE FUNCTION public.get_financeiro_fontes_cliente(p_cliente_id uuid)
RETURNS TABLE(
  cliente_plano_id uuid,
  plano_id uuid,
  plano_nome text,
  plano_valor numeric,
  contrato_id uuid,
  contrato_nome text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cp.id AS cliente_plano_id,
    cp.plano_id,
    p.nome AS plano_nome,
    cp.valor AS plano_valor,
    cc.id AS contrato_id,
    cc.nome AS contrato_nome
  FROM public.cliente_planos cp
  JOIN public.planos p ON p.id = cp.plano_id
  LEFT JOIN public.cliente_contratos cc
    ON cc.id = cp.contrato_id
   AND cc.deleted_at IS NULL
  WHERE cp.cliente_id = p_cliente_id
    AND cp.deleted_at IS NULL
    AND cp.status = 'ativo'
    AND (
      cp.contrato_id IS NULL
      OR (
        cc.id IS NOT NULL
        AND cc.status = 'ativo'
        AND COALESCE(cc.contrato_assinado, 'nao_assinado') <> 'cancelado'
      )
    )
    AND public.pode_visualizar_cliente(cp.cliente_id)
  ORDER BY p.nome;
$$;

COMMENT ON FUNCTION public.get_financeiro_fontes_cliente(uuid) IS
  'Retorna apenas planos ativos do cliente e contrato ativo opcional elegíveis para geração financeira.';

CREATE INDEX IF NOT EXISTS idx_transacoes_cliente_status_vencimento
  ON public.transacoes (cliente_id, status, data_vencimento)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transacoes_metadata_mes_competencia
  ON public.transacoes ((metadata->>'mes_competencia'))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transacoes_metadata_cliente_plano
  ON public.transacoes ((metadata->>'cliente_plano_id'))
  WHERE deleted_at IS NULL;

NOTIFY pgrst, 'reload schema';
