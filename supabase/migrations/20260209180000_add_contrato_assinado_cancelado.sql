-- Incluir opção 'cancelado' no campo contrato_assinado (cliente_planos e cliente_servicos).
-- Constraint atual: IN ('assinado', 'nao_assinado'). Nova: IN ('assinado', 'nao_assinado', 'cancelado').

ALTER TABLE public.cliente_planos
  DROP CONSTRAINT IF EXISTS cliente_planos_contrato_assinado_check;

ALTER TABLE public.cliente_planos
  ADD CONSTRAINT cliente_planos_contrato_assinado_check
  CHECK (contrato_assinado IN ('assinado', 'nao_assinado', 'cancelado'));

COMMENT ON COLUMN public.cliente_planos.contrato_assinado IS 'Contrato: Assinado, Não assinado ou Cancelado.';

ALTER TABLE public.cliente_servicos
  DROP CONSTRAINT IF EXISTS cliente_servicos_contrato_assinado_check;

ALTER TABLE public.cliente_servicos
  ADD CONSTRAINT cliente_servicos_contrato_assinado_check
  CHECK (contrato_assinado IN ('assinado', 'nao_assinado', 'cancelado'));

COMMENT ON COLUMN public.cliente_servicos.contrato_assinado IS 'Contrato: Assinado, Não assinado ou Cancelado.';
