-- Contrato como entidade: tabela cliente_contratos e vínculo em cliente_planos/cliente_servicos.
-- Requisitos: .context/docs/requisitos/contrato-entidade-vs-campo-servicos.md

-- 1) Tabela cliente_contratos
CREATE TABLE IF NOT EXISTS public.cliente_contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome text,
  status text NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'pausado', 'cancelado', 'finalizado')),
  contrato_assinado text NOT NULL DEFAULT 'nao_assinado'
    CHECK (contrato_assinado IN ('assinado', 'nao_assinado', 'cancelado')),
  data_inicio date,
  data_fim date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_cliente_contratos_cliente
  ON public.cliente_contratos(cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_contratos_deleted
  ON public.cliente_contratos(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.cliente_contratos IS 'Contratos do cliente (entidade acima de planos/serviços).';
COMMENT ON COLUMN public.cliente_contratos.contrato_assinado IS 'Assinado, Não assinado ou Cancelado.';

-- Trigger updated_at
CREATE TRIGGER update_cliente_contratos_updated_at
  BEFORE UPDATE ON public.cliente_contratos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2) FK em cliente_planos e cliente_servicos
ALTER TABLE public.cliente_planos
  ADD COLUMN IF NOT EXISTS contrato_id uuid REFERENCES public.cliente_contratos(id) ON DELETE SET NULL;

ALTER TABLE public.cliente_servicos
  ADD COLUMN IF NOT EXISTS contrato_id uuid REFERENCES public.cliente_contratos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cliente_planos_contrato ON public.cliente_planos(contrato_id) WHERE deleted_at IS NULL AND contrato_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cliente_servicos_contrato ON public.cliente_servicos(contrato_id) WHERE deleted_at IS NULL AND contrato_id IS NOT NULL;

COMMENT ON COLUMN public.cliente_planos.contrato_id IS 'Contrato ao qual este plano está vinculado (opcional).';
COMMENT ON COLUMN public.cliente_servicos.contrato_id IS 'Contrato ao qual este serviço está vinculado (opcional).';

-- 3) RLS cliente_contratos (mesmo critério: responsável do cliente ou admin)
ALTER TABLE public.cliente_contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cliente_contratos_select"
  ON public.cliente_contratos FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = cliente_contratos.cliente_id
          AND c.deleted_at IS NULL
          AND (c.responsavel_id = auth.uid() OR public.is_admin())
      )
    )
    AND cliente_contratos.deleted_at IS NULL
  );

CREATE POLICY "cliente_contratos_insert"
  ON public.cliente_contratos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_contratos.cliente_id
        AND c.deleted_at IS NULL
        AND (c.responsavel_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "cliente_contratos_update"
  ON public.cliente_contratos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_contratos.cliente_id
        AND c.deleted_at IS NULL
        AND (c.responsavel_id = auth.uid() OR public.is_admin())
    )
    AND cliente_contratos.deleted_at IS NULL
  );
