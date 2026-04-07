-- Consolida a decisão de acesso do módulo Ads: apenas perfil admin.
-- Mantém a regra explícita para evitar ambiguidades entre seeds anteriores.

INSERT INTO public.perfil_permissoes (perfil_id, modulo, pode_visualizar, pode_editar, pode_excluir)
SELECT
  p.id,
  'ads',
  CASE WHEN p.slug = 'admin' THEN true ELSE false END,
  CASE WHEN p.slug = 'admin' THEN true ELSE false END,
  CASE WHEN p.slug = 'admin' THEN true ELSE false END
FROM public.perfis p
ON CONFLICT (perfil_id, modulo) DO UPDATE SET
  pode_visualizar = EXCLUDED.pode_visualizar,
  pode_editar = EXCLUDED.pode_editar,
  pode_excluir = EXCLUDED.pode_excluir;

COMMENT ON TABLE public.perfil_permissoes IS
  'Permissões por perfil e módulo. No módulo ads, acesso definitivo apenas para perfil admin (decisão 2026-04-07).';
