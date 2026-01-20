-- Permitir admin em módulos principais

-- CLIENTES
DROP POLICY IF EXISTS "clientes_select_responsavel" ON public.clientes;
CREATE POLICY "clientes_select_responsavel" ON public.clientes
  FOR SELECT USING (
    (responsavel_id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin'))
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "clientes_insert_responsavel" ON public.clientes;
CREATE POLICY "clientes_insert_responsavel" ON public.clientes
  FOR INSERT WITH CHECK (
    responsavel_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "clientes_update_responsavel" ON public.clientes;
CREATE POLICY "clientes_update_responsavel" ON public.clientes
  FOR UPDATE USING (
    (responsavel_id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin'))
    AND deleted_at IS NULL
  );

-- SERVICOS_PRESTADOS
DROP POLICY IF EXISTS "servicos_prestados_select" ON public.servicos_prestados;
CREATE POLICY "servicos_prestados_select" ON public.servicos_prestados
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = servicos_prestados.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND servicos_prestados.deleted_at IS NULL
  );

DROP POLICY IF EXISTS "servicos_prestados_insert" ON public.servicos_prestados;
CREATE POLICY "servicos_prestados_insert" ON public.servicos_prestados
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE clientes.id = servicos_prestados.cliente_id
        AND clientes.responsavel_id = auth.uid()
        AND clientes.deleted_at IS NULL
    )
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "servicos_prestados_update" ON public.servicos_prestados;
CREATE POLICY "servicos_prestados_update" ON public.servicos_prestados
  FOR UPDATE USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = servicos_prestados.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND servicos_prestados.deleted_at IS NULL
  );

-- TRANSACOES
DROP POLICY IF EXISTS "transacoes_select" ON public.transacoes;
CREATE POLICY "transacoes_select" ON public.transacoes
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = transacoes.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND transacoes.deleted_at IS NULL
  );

DROP POLICY IF EXISTS "transacoes_insert" ON public.transacoes;
CREATE POLICY "transacoes_insert" ON public.transacoes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE clientes.id = transacoes.cliente_id
        AND clientes.responsavel_id = auth.uid()
        AND clientes.deleted_at IS NULL
    )
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "transacoes_update" ON public.transacoes;
CREATE POLICY "transacoes_update" ON public.transacoes
  FOR UPDATE USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = transacoes.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND transacoes.deleted_at IS NULL
  );

-- ATENDIMENTOS
DROP POLICY IF EXISTS "atendimentos_select" ON public.atendimentos;
CREATE POLICY "atendimentos_select" ON public.atendimentos
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = atendimentos.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND atendimentos.deleted_at IS NULL
  );

DROP POLICY IF EXISTS "atendimentos_insert" ON public.atendimentos;
CREATE POLICY "atendimentos_insert" ON public.atendimentos
  FOR INSERT WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = atendimentos.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND (
      atendimentos.usuario_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
  );

DROP POLICY IF EXISTS "atendimentos_update" ON public.atendimentos;
CREATE POLICY "atendimentos_update" ON public.atendimentos
  FOR UPDATE USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = atendimentos.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND (
      atendimentos.usuario_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND atendimentos.deleted_at IS NULL
  );

-- EQUIPE_MEMBROS
DROP POLICY IF EXISTS "equipe_membros_select" ON public.equipe_membros;
CREATE POLICY "equipe_membros_select" ON public.equipe_membros
  FOR SELECT USING (
    (responsavel_id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin'))
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "equipe_membros_insert" ON public.equipe_membros;
CREATE POLICY "equipe_membros_insert" ON public.equipe_membros
  FOR INSERT WITH CHECK (
    responsavel_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "equipe_membros_update" ON public.equipe_membros;
CREATE POLICY "equipe_membros_update" ON public.equipe_membros
  FOR UPDATE USING (
    (responsavel_id = auth.uid() OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin'))
    AND deleted_at IS NULL
  );

-- CLIENTE_RESPONSAVEIS
DROP POLICY IF EXISTS "cliente_responsaveis_select" ON public.cliente_responsaveis;
CREATE POLICY "cliente_responsaveis_select" ON public.cliente_responsaveis
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = cliente_responsaveis.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND cliente_responsaveis.deleted_at IS NULL
  );

DROP POLICY IF EXISTS "cliente_responsaveis_insert" ON public.cliente_responsaveis;
CREATE POLICY "cliente_responsaveis_insert" ON public.cliente_responsaveis
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clientes
      WHERE clientes.id = cliente_responsaveis.cliente_id
        AND clientes.responsavel_id = auth.uid()
        AND clientes.deleted_at IS NULL
    )
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "cliente_responsaveis_update" ON public.cliente_responsaveis;
CREATE POLICY "cliente_responsaveis_update" ON public.cliente_responsaveis
  FOR UPDATE USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = cliente_responsaveis.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND cliente_responsaveis.deleted_at IS NULL
  );
