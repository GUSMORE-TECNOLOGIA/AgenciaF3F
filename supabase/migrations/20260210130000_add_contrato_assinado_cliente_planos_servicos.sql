-- Campo Contrato: Assinado / Não assinado em contratos de plano e de serviço do cliente.
-- Convenção: contrato_assinado text check ('assinado', 'nao_assinado'), default 'nao_assinado'.

ALTER TABLE public.cliente_planos
  ADD COLUMN IF NOT EXISTS contrato_assinado text NOT NULL DEFAULT 'nao_assinado'
    CHECK (contrato_assinado IN ('assinado', 'nao_assinado'));

COMMENT ON COLUMN public.cliente_planos.contrato_assinado IS 'Contrato: Assinado ou Não assinado.';

ALTER TABLE public.cliente_servicos
  ADD COLUMN IF NOT EXISTS contrato_assinado text NOT NULL DEFAULT 'nao_assinado'
    CHECK (contrato_assinado IN ('assinado', 'nao_assinado'));

COMMENT ON COLUMN public.cliente_servicos.contrato_assinado IS 'Contrato: Assinado ou Não assinado.';
