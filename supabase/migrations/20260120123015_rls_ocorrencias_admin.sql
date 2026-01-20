-- Atualizar políticas RLS de ocorrências/grupos/tipos para permitir admin

-- OCORRENCIA GRUPOS
DROP POLICY IF EXISTS "ocorrencia_grupos_select" ON public.ocorrencia_grupos;
CREATE POLICY "ocorrencia_grupos_select" ON public.ocorrencia_grupos
  FOR SELECT USING (
    (responsavel_id = auth.uid() AND is_active = true)
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "ocorrencia_grupos_insert" ON public.ocorrencia_grupos;
CREATE POLICY "ocorrencia_grupos_insert" ON public.ocorrencia_grupos
  FOR INSERT WITH CHECK (
    responsavel_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "ocorrencia_grupos_update" ON public.ocorrencia_grupos;
CREATE POLICY "ocorrencia_grupos_update" ON public.ocorrencia_grupos
  FOR UPDATE USING (
    responsavel_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- OCORRENCIA TIPOS
DROP POLICY IF EXISTS "ocorrencia_tipos_select" ON public.ocorrencia_tipos;
CREATE POLICY "ocorrencia_tipos_select" ON public.ocorrencia_tipos
  FOR SELECT USING (
    (responsavel_id = auth.uid() AND is_active = true)
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "ocorrencia_tipos_insert" ON public.ocorrencia_tipos;
CREATE POLICY "ocorrencia_tipos_insert" ON public.ocorrencia_tipos
  FOR INSERT WITH CHECK (
    responsavel_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "ocorrencia_tipos_update" ON public.ocorrencia_tipos;
CREATE POLICY "ocorrencia_tipos_update" ON public.ocorrencia_tipos
  FOR UPDATE USING (
    responsavel_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- OCORRENCIAS
DROP POLICY IF EXISTS "ocorrencias_select" ON public.ocorrencias;
CREATE POLICY "ocorrencias_select" ON public.ocorrencias
  FOR SELECT USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = ocorrencias.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND ocorrencias.deleted_at IS NULL
  );

DROP POLICY IF EXISTS "ocorrencias_insert" ON public.ocorrencias;
CREATE POLICY "ocorrencias_insert" ON public.ocorrencias
  FOR INSERT WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = ocorrencias.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND (
      ocorrencias.responsavel_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
  );

DROP POLICY IF EXISTS "ocorrencias_update" ON public.ocorrencias;
CREATE POLICY "ocorrencias_update" ON public.ocorrencias
  FOR UPDATE USING (
    (
      EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = ocorrencias.cliente_id
          AND clientes.responsavel_id = auth.uid()
          AND clientes.deleted_at IS NULL
      )
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND (
      ocorrencias.responsavel_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
    AND ocorrencias.deleted_at IS NULL
  );
