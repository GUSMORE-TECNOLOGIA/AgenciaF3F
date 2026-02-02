-- Corrigir erro "Database error querying schema" na API (PostgREST)
-- Garante que o schema public está acessível e força reload do schema.
-- Ref: https://supabase.com/docs/guides/troubleshooting/pgrst106-the-schema-must-be-one-of-the-following-error-when-querying-an-exposed-schema

-- Garantir uso do schema public pelas roles da API
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Garantir que a API pode ler a tabela usuarios (RLS ainda restringe por linha)
GRANT SELECT ON public.usuarios TO authenticated;
GRANT INSERT ON public.usuarios TO authenticated;
GRANT UPDATE ON public.usuarios TO authenticated;

-- Forçar PostgREST a recarregar o schema (resolve cache/schema desatualizado)
NOTIFY pgrst, 'reload schema';

-- Se o erro persistir, executar no SQL Editor do Dashboard (como superuser):
-- ALTER ROLE authenticator RESET pgrst.db_schemas;
