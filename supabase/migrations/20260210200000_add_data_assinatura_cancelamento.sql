-- Datas de assinatura e cancelamento em contrato, plano e serviço.
-- Requisitos: .context/docs/requisitos/contrato-cascade-e-datas.md

-- cliente_contratos
ALTER TABLE public.cliente_contratos
  ADD COLUMN IF NOT EXISTS data_assinatura date,
  ADD COLUMN IF NOT EXISTS data_cancelamento date;

COMMENT ON COLUMN public.cliente_contratos.data_assinatura IS 'Data em que o contrato foi assinado.';
COMMENT ON COLUMN public.cliente_contratos.data_cancelamento IS 'Data em que o contrato foi cancelado.';

-- cliente_planos
ALTER TABLE public.cliente_planos
  ADD COLUMN IF NOT EXISTS data_assinatura date,
  ADD COLUMN IF NOT EXISTS data_cancelamento date;

COMMENT ON COLUMN public.cliente_planos.data_assinatura IS 'Data em que o plano foi assinado.';
COMMENT ON COLUMN public.cliente_planos.data_cancelamento IS 'Data em que o plano foi cancelado.';

-- cliente_servicos
ALTER TABLE public.cliente_servicos
  ADD COLUMN IF NOT EXISTS data_assinatura date,
  ADD COLUMN IF NOT EXISTS data_cancelamento date;

COMMENT ON COLUMN public.cliente_servicos.data_assinatura IS 'Data em que o serviço foi assinado.';
COMMENT ON COLUMN public.cliente_servicos.data_cancelamento IS 'Data em que o serviço foi cancelado.';
