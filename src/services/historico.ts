import { supabase } from './supabase'

export interface ContratoStatusHistorico {
  id: string
  tipo_contrato: 'plano' | 'servico'
  contrato_id: string
  status_anterior: string | null
  status_novo: string
  usuario_id: string | null
  observacoes: string | null
  metadata: Record<string, any> | null
  created_at: string
}

/**
 * Buscar histórico de mudanças de status de um contrato
 */
export async function fetchHistoricoStatusContrato(
  tipoContrato: 'plano' | 'servico',
  contratoId: string
): Promise<ContratoStatusHistorico[]> {
  try {
    const { data, error } = await supabase
      .from('contrato_status_historico')
      .select(
        `
        *,
        usuario:usuarios(id, name, email)
      `
      )
      .eq('tipo_contrato', tipoContrato)
      .eq('contrato_id', contratoId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar histórico:', error)
      throw error
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      tipo_contrato: item.tipo_contrato,
      contrato_id: item.contrato_id,
      status_anterior: item.status_anterior,
      status_novo: item.status_novo,
      usuario_id: item.usuario_id,
      observacoes: item.observacoes,
      metadata: item.metadata,
      created_at: item.created_at,
      usuario: item.usuario
        ? {
            id: item.usuario.id,
            name: item.usuario.name,
            email: item.usuario.email,
          }
        : null,
    }))
  } catch (error) {
    console.error('Erro em fetchHistoricoStatusContrato:', error)
    throw error
  }
}
