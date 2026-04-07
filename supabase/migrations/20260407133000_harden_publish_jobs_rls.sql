-- Harden RLS for publish_jobs: client-side remains append/read only.
-- Status transitions are executed server-side via Edge Function using service_role.

ALTER TABLE public.publish_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "publish_jobs_select_own" ON public.publish_jobs;
DROP POLICY IF EXISTS "publish_jobs_insert_own" ON public.publish_jobs;
DROP POLICY IF EXISTS "publish_jobs_update_own" ON public.publish_jobs;
DROP POLICY IF EXISTS "publish_jobs_delete_own" ON public.publish_jobs;

CREATE POLICY "publish_jobs_select_own"
  ON public.publish_jobs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "publish_jobs_insert_own"
  ON public.publish_jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('pending', 'in_progress', 'success', 'failed', 'dedupe_blocked')
  );

COMMENT ON TABLE public.publish_jobs IS
  'Histórico/idempotência Meta Ads por usuário. Cliente autenticado pode apenas SELECT/INSERT; UPDATE é server-side.';
