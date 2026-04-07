-- Temporário: restringir módulo ads somente para admin.
-- Mantém a linha de permissão para todos os perfis, mas com acesso desabilitado para não-admin.

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
