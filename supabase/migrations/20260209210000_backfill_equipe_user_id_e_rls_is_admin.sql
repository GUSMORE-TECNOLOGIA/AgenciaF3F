-- Causa raiz: equipe_membros.user_id estava NULL para todos.
-- Sem vínculo, RPCs retornam usuarios.name (ex.: "Administrador") em vez de equipe_membros.nome_completo.
-- Além disso, RLS em equipe_membros usava apenas u.role = 'admin', não is_admin().

-- 1) Backfill: vincular equipe_membros a usuarios por email (case-insensitive)
UPDATE equipe_membros em
SET user_id = u.id, updated_at = NOW()
FROM usuarios u
WHERE em.deleted_at IS NULL
  AND em.email IS NOT NULL
  AND LOWER(TRIM(u.email)) = LOWER(TRIM(em.email))
  AND em.user_id IS NULL;

-- 2) RLS equipe_membros: usar is_admin() para SELECT/INSERT/UPDATE (admin por perfil)
DROP POLICY IF EXISTS "equipe_membros_select" ON public.equipe_membros;
CREATE POLICY "equipe_membros_select" ON public.equipe_membros
  FOR SELECT USING (
    ((responsavel_id = auth.uid()) OR is_admin()) AND (deleted_at IS NULL)
  );

DROP POLICY IF EXISTS "equipe_membros_insert" ON public.equipe_membros;
CREATE POLICY "equipe_membros_insert" ON public.equipe_membros
  FOR INSERT WITH CHECK (
    (responsavel_id = auth.uid()) OR is_admin()
  );

DROP POLICY IF EXISTS "equipe_membros_update" ON public.equipe_membros;
CREATE POLICY "equipe_membros_update" ON public.equipe_membros
  FOR UPDATE USING (
    ((responsavel_id = auth.uid()) OR is_admin()) AND (deleted_at IS NULL)
  );
