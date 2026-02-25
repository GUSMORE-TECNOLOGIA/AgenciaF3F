-- RPC de diagnóstico: retorna auth.uid() e quantos clientes o usuário atual enxerga.
-- Uso: quando o agente vê 0 clientes, chamar esta RPC para obter o uid real do login;
-- o admin pode então rodar UPDATE clientes SET responsavel_id = '<auth_uid>' WHERE responsavel_id = '<uid_antigo>' para corrigir.
CREATE OR REPLACE FUNCTION public.get_debug_visibilidade_clientes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_total bigint;
  v_admin boolean;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('auth_uid', null, 'total_visiveis', 0, 'is_admin', false, 'mensagem', 'Não autenticado');
  END IF;
  SELECT public.is_admin() INTO v_admin;
  SELECT COUNT(*)::bigint INTO v_total
  FROM public.clientes c
  WHERE c.deleted_at IS NULL AND public.is_responsavel_do_cliente(c.id);
  RETURN jsonb_build_object(
    'auth_uid', v_uid,
    'total_visiveis', v_total,
    'is_admin', v_admin,
    'mensagem', CASE WHEN v_total = 0 AND NOT v_admin THEN 'Nenhum cliente atribuído a este usuário. Peça ao admin para rodar: UPDATE clientes SET responsavel_id = ''' || v_uid::text || ''' WHERE responsavel_id = ''<uid_do_perfil_antigo>'';' ELSE NULL END
  );
END;
$$;

COMMENT ON FUNCTION public.get_debug_visibilidade_clientes() IS 'Diagnóstico: auth_uid e total de clientes visíveis; usar quando agente vê 0 para alinhar responsavel_id.';
