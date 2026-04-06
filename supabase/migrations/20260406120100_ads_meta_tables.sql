-- Tabelas do módulo Meta Ads (legado ADIFY), RLS por auth.uid() = user_id.
-- Não replica tabela profiles do ADIFY (usa-se usuarios / auth do F3F).

CREATE TABLE IF NOT EXISTS public.meta_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_connections_user_id ON public.meta_connections(user_id);

ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meta_connections_select_own" ON public.meta_connections;
DROP POLICY IF EXISTS "meta_connections_insert_own" ON public.meta_connections;
DROP POLICY IF EXISTS "meta_connections_update_own" ON public.meta_connections;
DROP POLICY IF EXISTS "meta_connections_delete_own" ON public.meta_connections;

CREATE POLICY "meta_connections_select_own" ON public.meta_connections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "meta_connections_insert_own" ON public.meta_connections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meta_connections_update_own" ON public.meta_connections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "meta_connections_delete_own" ON public.meta_connections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_meta_connections_updated_at ON public.meta_connections;
CREATE TRIGGER update_meta_connections_updated_at
  BEFORE UPDATE ON public.meta_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.publish_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  request_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_json JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publish_jobs_user_created ON public.publish_jobs(user_id, created_at DESC);

ALTER TABLE public.publish_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "publish_jobs_select_own" ON public.publish_jobs;
DROP POLICY IF EXISTS "publish_jobs_insert_own" ON public.publish_jobs;

CREATE POLICY "publish_jobs_select_own" ON public.publish_jobs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "publish_jobs_insert_own" ON public.publish_jobs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  greeting TEXT NOT NULL DEFAULT '',
  ready_message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_user ON public.message_templates(user_id, created_at DESC);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "message_templates_select_own" ON public.message_templates;
DROP POLICY IF EXISTS "message_templates_insert_own" ON public.message_templates;
DROP POLICY IF EXISTS "message_templates_update_own" ON public.message_templates;
DROP POLICY IF EXISTS "message_templates_delete_own" ON public.message_templates;

CREATE POLICY "message_templates_select_own" ON public.message_templates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "message_templates_insert_own" ON public.message_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "message_templates_update_own" ON public.message_templates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "message_templates_delete_own" ON public.message_templates
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

COMMENT ON TABLE public.meta_connections IS 'Token Meta (Marketing API) por usuário — módulo Ads.';
COMMENT ON TABLE public.publish_jobs IS 'Histórico / idempotência de publicações Meta — módulo Ads.';
COMMENT ON TABLE public.message_templates IS 'Modelos de mensagem WhatsApp (Fase 3) — módulo Ads.';
