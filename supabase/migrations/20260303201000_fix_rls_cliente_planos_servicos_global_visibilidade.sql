-- Corrige RLS de escrita para contratos de planos/serviços no modelo de visibilidade global.
-- Problema: policies antigas de INSERT/UPDATE ainda dependiam de clientes.responsavel_id (legado).

-- CLIENTE_PLANOS: garantir escrita por regra global de visibilidade
CREATE POLICY vis_global_insert_cliente_planos
  ON public.cliente_planos
  FOR INSERT
  WITH CHECK (public.pode_visualizar_cliente(cliente_id));

CREATE POLICY vis_global_update_cliente_planos
  ON public.cliente_planos
  FOR UPDATE
  USING (public.pode_visualizar_cliente(cliente_id) AND deleted_at IS NULL)
  WITH CHECK (public.pode_visualizar_cliente(cliente_id));

-- CLIENTE_SERVICOS: garantir escrita por regra global de visibilidade
CREATE POLICY vis_global_insert_cliente_servicos
  ON public.cliente_servicos
  FOR INSERT
  WITH CHECK (public.pode_visualizar_cliente(cliente_id));

CREATE POLICY vis_global_update_cliente_servicos
  ON public.cliente_servicos
  FOR UPDATE
  USING (public.pode_visualizar_cliente(cliente_id) AND deleted_at IS NULL)
  WITH CHECK (public.pode_visualizar_cliente(cliente_id));

NOTIFY pgrst, 'reload schema';
