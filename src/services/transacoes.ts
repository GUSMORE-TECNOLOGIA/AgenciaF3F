import { supabase } from './supabase'
import { Transacao } from '@/types'

export interface TransacaoCreateInput {
  cliente_id: string
  servico_id?: string
  tipo: 'receita' | 'despesa'
  categoria: string
  valor: number
  moeda?: string
  descricao: string
  metodo_pagamento?: string
  status?: 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado'
  data_vencimento: string // DATE format: YYYY-MM-DD
  data_pagamento?: string // TIMESTAMPTZ
  external_transaction_id?: string
  external_source?: string
  metadata?: Record<string, any>
}

/**
 * Criar nova transação financeira
 */
export async function createTransacao(input: TransacaoCreateInput): Promise<Transacao> {
  try {
    const { data, error } = await supabase
      .from('transacoes')
      .insert({
        cliente_id: input.cliente_id,
        servico_id: input.servico_id || null,
        tipo: input.tipo,
        categoria: input.categoria,
        valor: input.valor,
        moeda: input.moeda || 'BRL',
        descricao: input.descricao,
        metodo_pagamento: input.metodo_pagamento || null,
        status: input.status || 'pendente',
        data_vencimento: input.data_vencimento,
        data_pagamento: input.data_pagamento || null,
        external_transaction_id: input.external_transaction_id || null,
        external_source: input.external_source || null,
        metadata: input.metadata || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar transação:', error)
      throw error
    }

    return {
      id: data.id,
      cliente_id: data.cliente_id,
      servico_id: data.servico_id || undefined,
      tipo: data.tipo,
      categoria: data.categoria,
      valor: Number(data.valor),
      moeda: data.moeda,
      descricao: data.descricao,
      metodo_pagamento: data.metodo_pagamento || undefined,
      status: data.status,
      data_vencimento: data.data_vencimento,
      data_pagamento: data.data_pagamento || undefined,
      external_transaction_id: data.external_transaction_id || undefined,
      external_source: data.external_source || undefined,
      metadata: data.metadata || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em createTransacao:', error)
    throw error
  }
}

/**
 * Criar transação a partir de contrato de plano
 */
export async function createTransacaoFromPlano(
  clienteId: string,
  planoId: string,
  valor: number,
  dataVencimento: string,
  observacoes?: string
): Promise<Transacao> {
  return createTransacao({
    cliente_id: clienteId,
    tipo: 'receita',
    categoria: 'plano',
    valor,
    descricao: `Contrato de plano${observacoes ? ` - ${observacoes}` : ''}`,
    status: 'pendente',
    data_vencimento: dataVencimento,
    metadata: {
      plano_id: planoId,
      origem: 'contrato_plano',
    },
  })
}

/**
 * Criar transação a partir de contrato de serviço avulso
 */
export async function createTransacaoFromServico(
  clienteId: string,
  servicoId: string,
  valor: number,
  dataVencimento: string,
  observacoes?: string
): Promise<Transacao> {
  return createTransacao({
    cliente_id: clienteId,
    servico_id: servicoId,
    tipo: 'receita',
    categoria: 'servico_avulso',
    valor,
    descricao: `Contrato de serviço avulso${observacoes ? ` - ${observacoes}` : ''}`,
    status: 'pendente',
    data_vencimento: dataVencimento,
    metadata: {
      servico_id: servicoId,
      origem: 'contrato_servico',
    },
  })
}
