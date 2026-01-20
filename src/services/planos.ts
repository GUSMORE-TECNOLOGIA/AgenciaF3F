import { supabase } from './supabase'
import { Servico, Plano, PlanoServico, ClientePlano, ClienteServico, Cliente } from '@/types'
import type {
  ServicoCreateInput,
  ServicoUpdateInput,
  PlanoCreateInput,
  PlanoUpdateInput,
  PlanoServicoCreateInput,
  ClientePlanoCreateInput,
  ClientePlanoUpdateInput,
  ClienteServicoCreateInput,
  ClienteServicoUpdateInput,
} from '@/lib/validators/plano-schema'

// Re-exportar tipos para facilitar importação
export type {
  ServicoCreateInput,
  ServicoUpdateInput,
  PlanoCreateInput,
  PlanoUpdateInput,
  PlanoServicoCreateInput,
  ClientePlanoCreateInput,
  ClientePlanoUpdateInput,
  ClienteServicoCreateInput,
  ClienteServicoUpdateInput,
}

// ============================================================================
// SERVIÇOS MESTRES
// ============================================================================

/**
 * Buscar lista de serviços mestres
 */
export async function fetchServicos(ativo?: boolean): Promise<Servico[]> {
  try {
    let query = supabase
      .from('servicos')
      .select('*')
      .is('deleted_at', null)
      .order('nome', { ascending: true })

    if (ativo !== undefined) {
      query = query.eq('ativo', ativo)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar serviços:', error)
      throw error
    }

    return (data || []).map((item) => ({
      id: item.id,
      nome: item.nome,
      descricao: item.descricao || undefined,
      valor: item.valor ? Number(item.valor) : undefined,
      ativo: item.ativo,
      created_at: item.created_at,
      updated_at: item.updated_at,
      deleted_at: item.deleted_at || undefined,
    }))
  } catch (error) {
    console.error('Erro em fetchServicos:', error)
    throw error
  }
}

/**
 * Buscar um serviço mestre por ID
 */
export async function fetchServicoById(id: string): Promise<Servico | null> {
  try {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Erro ao buscar serviço:', error)
      throw error
    }

    return {
      id: data.id,
      nome: data.nome,
      descricao: data.descricao || undefined,
      valor: data.valor ? Number(data.valor) : undefined,
      ativo: data.ativo,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em fetchServicoById:', error)
    throw error
  }
}

/**
 * Criar novo serviço mestre
 */
export async function createServico(input: ServicoCreateInput): Promise<Servico> {
  try {
    const { data, error } = await supabase
      .from('servicos')
      .insert({
        nome: input.nome,
        descricao: input.descricao || null,
        valor: input.valor || null,
        ativo: input.ativo ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar serviço:', error)
      throw error
    }

    return {
      id: data.id,
      nome: data.nome,
      descricao: data.descricao || undefined,
      valor: data.valor ? Number(data.valor) : undefined,
      ativo: data.ativo,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em createServico:', error)
    throw error
  }
}

/**
 * Atualizar serviço mestre
 */
export async function updateServico(id: string, input: ServicoUpdateInput): Promise<Servico> {
  try {
    const updateData: any = {}

    if (input.nome !== undefined) updateData.nome = input.nome
    if (input.descricao !== undefined) updateData.descricao = input.descricao || null
    if (input.valor !== undefined) updateData.valor = input.valor || null
    if (input.ativo !== undefined) updateData.ativo = input.ativo

    const { data, error } = await supabase
      .from('servicos')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar serviço:', error)
      throw error
    }

    return {
      id: data.id,
      nome: data.nome,
      descricao: data.descricao || undefined,
      valor: data.valor ? Number(data.valor) : undefined,
      ativo: data.ativo,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em updateServico:', error)
    throw error
  }
}

/**
 * Soft delete de serviço mestre
 */
export async function deleteServico(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('soft_delete_servico', { servico_id: id })

    if (error) {
      console.error('Erro ao deletar serviço:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro em deleteServico:', error)
    throw error
  }
}

// ============================================================================
// PLANOS
// ============================================================================

/**
 * Buscar lista de planos
 */
export async function fetchPlanos(ativo?: boolean): Promise<Plano[]> {
  try {
    let query = supabase
      .from('planos')
      .select('*')
      .is('deleted_at', null)
      .order('nome', { ascending: true })

    if (ativo !== undefined) {
      query = query.eq('ativo', ativo)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar planos:', error)
      throw error
    }

    return (data || []).map((item) => ({
      id: item.id,
      nome: item.nome,
      descricao: item.descricao || undefined,
      valor: Number(item.valor),
      moeda: item.moeda,
      ativo: item.ativo,
      created_at: item.created_at,
      updated_at: item.updated_at,
      deleted_at: item.deleted_at || undefined,
    }))
  } catch (error) {
    console.error('Erro em fetchPlanos:', error)
    throw error
  }
}

/**
 * Buscar um plano por ID com serviços vinculados
 */
export async function fetchPlanoById(id: string): Promise<Plano | null> {
  try {
    const { data, error } = await supabase
      .from('planos')
      .select(
        `
        *,
        servicos:plano_servicos(
          ordem,
          servico:servicos(*)
        )
      `
      )
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Erro ao buscar plano:', error)
      throw error
    }

    const servicos = (data.plano_servicos || [])
      .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))
      .map((ps: any) => ({
        id: ps.servico.id,
        nome: ps.servico.nome,
        descricao: ps.servico.descricao || undefined,
        valor: ps.servico.valor ? Number(ps.servico.valor) : undefined,
        ativo: ps.servico.ativo,
        created_at: ps.servico.created_at,
        updated_at: ps.servico.updated_at,
        deleted_at: ps.servico.deleted_at || undefined,
      }))

    return {
      id: data.id,
      nome: data.nome,
      descricao: data.descricao || undefined,
      valor: Number(data.valor),
      moeda: data.moeda,
      ativo: data.ativo,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
      servicos,
    }
  } catch (error) {
    console.error('Erro em fetchPlanoById:', error)
    throw error
  }
}

/**
 * Criar novo plano
 */
export async function createPlano(input: PlanoCreateInput): Promise<Plano> {
  try {
    const { data, error } = await supabase
      .from('planos')
      .insert({
        nome: input.nome,
        descricao: input.descricao || null,
        valor: input.valor,
        moeda: input.moeda || 'BRL',
        ativo: input.ativo ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar plano:', error)
      throw error
    }

    return {
      id: data.id,
      nome: data.nome,
      descricao: data.descricao || undefined,
      valor: Number(data.valor),
      moeda: data.moeda,
      ativo: data.ativo,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em createPlano:', error)
    throw error
  }
}

/**
 * Atualizar plano
 */
export async function updatePlano(id: string, input: PlanoUpdateInput): Promise<Plano> {
  try {
    const updateData: any = {}

    if (input.nome !== undefined) updateData.nome = input.nome
    if (input.descricao !== undefined) updateData.descricao = input.descricao || null
    if (input.valor !== undefined) updateData.valor = input.valor
    if (input.moeda !== undefined) updateData.moeda = input.moeda
    if (input.ativo !== undefined) updateData.ativo = input.ativo

    const { data, error } = await supabase
      .from('planos')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar plano:', error)
      throw error
    }

    return {
      id: data.id,
      nome: data.nome,
      descricao: data.descricao || undefined,
      valor: Number(data.valor),
      moeda: data.moeda,
      ativo: data.ativo,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em updatePlano:', error)
    throw error
  }
}

/**
 * Soft delete de plano
 */
export async function deletePlano(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('soft_delete_plano', { plano_id: id })

    if (error) {
      console.error('Erro ao deletar plano:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro em deletePlano:', error)
    throw error
  }
}

// ============================================================================
// RELAÇÃO PLANO-SERVIÇOS (N:N)
// ============================================================================

/**
 * Buscar serviços vinculados a um plano
 */
export async function fetchPlanoServicos(planoId: string): Promise<PlanoServico[]> {
  try {
    const { data, error } = await supabase
      .from('plano_servicos')
      .select(
        `
        *,
        plano:planos(*),
        servico:servicos(*)
      `
      )
      .eq('plano_id', planoId)
      .order('ordem', { ascending: true })

    if (error) {
      console.error('Erro ao buscar serviços do plano:', error)
      throw error
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      plano_id: item.plano_id,
      servico_id: item.servico_id,
      ordem: item.ordem || 0,
      created_at: item.created_at,
      plano: item.plano
        ? {
            id: item.plano.id,
            nome: item.plano.nome,
            descricao: item.plano.descricao || undefined,
            valor: Number(item.plano.valor),
            moeda: item.plano.moeda,
            ativo: item.plano.ativo,
            created_at: item.plano.created_at,
            updated_at: item.plano.updated_at,
            deleted_at: item.plano.deleted_at || undefined,
          }
        : undefined,
      servico: item.servico
        ? {
            id: item.servico.id,
            nome: item.servico.nome,
            descricao: item.servico.descricao || undefined,
            valor: item.servico.valor ? Number(item.servico.valor) : undefined,
            ativo: item.servico.ativo,
            created_at: item.servico.created_at,
            updated_at: item.servico.updated_at,
            deleted_at: item.servico.deleted_at || undefined,
          }
        : undefined,
    }))
  } catch (error) {
    console.error('Erro em fetchPlanoServicos:', error)
    throw error
  }
}

/**
 * Adicionar serviço a um plano
 */
export async function addServicoToPlano(input: PlanoServicoCreateInput): Promise<PlanoServico> {
  try {
    const { data, error } = await supabase
      .from('plano_servicos')
      .insert({
        plano_id: input.plano_id,
        servico_id: input.servico_id,
        ordem: input.ordem || 0,
      })
      .select(
        `
        *,
        plano:planos(*),
        servico:servicos(*)
      `
      )
      .single()

    if (error) {
      console.error('Erro ao adicionar serviço ao plano:', error)
      throw error
    }

    return {
      id: data.id,
      plano_id: data.plano_id,
      servico_id: data.servico_id,
      ordem: data.ordem || 0,
      created_at: data.created_at,
      plano: data.plano
        ? {
            id: data.plano.id,
            nome: data.plano.nome,
            descricao: data.plano.descricao || undefined,
            valor: Number(data.plano.valor),
            moeda: data.plano.moeda,
            ativo: data.plano.ativo,
            created_at: data.plano.created_at,
            updated_at: data.plano.updated_at,
            deleted_at: data.plano.deleted_at || undefined,
          }
        : undefined,
      servico: data.servico
        ? {
            id: data.servico.id,
            nome: data.servico.nome,
            descricao: data.servico.descricao || undefined,
            valor: data.servico.valor ? Number(data.servico.valor) : undefined,
            ativo: data.servico.ativo,
            created_at: data.servico.created_at,
            updated_at: data.servico.updated_at,
            deleted_at: data.servico.deleted_at || undefined,
          }
        : undefined,
    }
  } catch (error) {
    console.error('Erro em addServicoToPlano:', error)
    throw error
  }
}

/**
 * Remover serviço de um plano
 */
export async function removeServicoFromPlano(planoId: string, servicoId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('plano_servicos')
      .delete()
      .eq('plano_id', planoId)
      .eq('servico_id', servicoId)

    if (error) {
      console.error('Erro ao remover serviço do plano:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro em removeServicoFromPlano:', error)
    throw error
  }
}

/**
 * Atualizar ordem dos serviços em um plano
 */
export async function updatePlanoServicosOrdem(
  planoId: string,
  servicos: { servico_id: string; ordem: number }[]
): Promise<void> {
  try {
    // Remover todos os serviços do plano
    await supabase.from('plano_servicos').delete().eq('plano_id', planoId)

    // Inserir novamente com as novas ordens
    if (servicos.length > 0) {
      const { error } = await supabase.from('plano_servicos').insert(
        servicos.map((s) => ({
          plano_id: planoId,
          servico_id: s.servico_id,
          ordem: s.ordem,
        }))
      )

      if (error) {
        console.error('Erro ao atualizar ordem dos serviços:', error)
        throw error
      }
    }
  } catch (error) {
    console.error('Erro em updatePlanoServicosOrdem:', error)
    throw error
  }
}

// ============================================================================
// CONTRATOS CLIENTE-PLANOS
// ============================================================================

/**
 * Buscar contratos de planos de um cliente
 */
export async function fetchClientePlanos(clienteId: string): Promise<ClientePlano[]> {
  try {
    const { data, error } = await supabase
      .from('cliente_planos')
      .select(
        `
        *,
        cliente:clientes(id, nome),
        plano:planos(*)
      `
      )
      .eq('cliente_id', clienteId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar contratos de planos:', error)
      throw error
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      cliente_id: item.cliente_id,
      plano_id: item.plano_id,
      valor: Number(item.valor),
      moeda: item.moeda,
      status: item.status,
      data_inicio: item.data_inicio || undefined,
      data_fim: item.data_fim || undefined,
      observacoes: item.observacoes || undefined,
      created_at: item.created_at,
      updated_at: item.updated_at,
      deleted_at: item.deleted_at || undefined,
      cliente: item.cliente
        ? ({
            id: item.cliente.id,
            nome: item.cliente.nome,
          } as Cliente)
        : undefined,
      plano: item.plano
        ? {
            id: item.plano.id,
            nome: item.plano.nome,
            descricao: item.plano.descricao || undefined,
            valor: Number(item.plano.valor),
            moeda: item.plano.moeda,
            ativo: item.plano.ativo,
            created_at: item.plano.created_at,
            updated_at: item.plano.updated_at,
            deleted_at: item.plano.deleted_at || undefined,
          }
        : undefined,
    }))
  } catch (error) {
    console.error('Erro em fetchClientePlanos:', error)
    throw error
  }
}

/**
 * Criar contrato de cliente com plano
 */
export async function createClientePlano(input: ClientePlanoCreateInput): Promise<ClientePlano> {
  try {
    const { data, error } = await supabase
      .from('cliente_planos')
      .insert({
        cliente_id: input.cliente_id,
        plano_id: input.plano_id,
        valor: input.valor,
        moeda: input.moeda || 'BRL',
        status: input.status || 'ativo',
        data_inicio: input.data_inicio || null,
        data_fim: input.data_fim || null,
        observacoes: input.observacoes || null,
      })
      .select(
        `
        *,
        cliente:clientes(id, nome),
        plano:planos(*)
      `
      )
      .single()

    if (error) {
      console.error('Erro ao criar contrato de plano:', error)
      throw error
    }

    const contrato: ClientePlano = {
      id: data.id,
      cliente_id: data.cliente_id,
      plano_id: data.plano_id,
      valor: Number(data.valor),
      moeda: data.moeda,
      status: data.status,
      data_inicio: data.data_inicio || undefined,
      data_fim: data.data_fim || undefined,
      observacoes: data.observacoes || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
      cliente: data.cliente
        ? ({
            id: data.cliente.id,
            nome: data.cliente.nome,
          } as Cliente)
        : undefined,
      plano: data.plano
        ? {
            id: data.plano.id,
            nome: data.plano.nome,
            descricao: data.plano.descricao || undefined,
            valor: Number(data.plano.valor),
            moeda: data.plano.moeda,
            ativo: data.plano.ativo,
            created_at: data.plano.created_at,
            updated_at: data.plano.updated_at,
            deleted_at: data.plano.deleted_at || undefined,
          }
        : undefined,
    }

    // Gerar transações automáticas se tiver data de início
    if (contrato.data_inicio) {
      try {
        const { gerarTransacoesContratoPlano } = await import('./financeiro')
        await gerarTransacoesContratoPlano(contrato)
      } catch (error) {
        console.error('Erro ao gerar transações automáticas:', error)
        // Não falha a criação do contrato se a geração de transações falhar
      }
    }

    return contrato
  } catch (error) {
    console.error('Erro em createClientePlano:', error)
    throw error
  }
}

/**
 * Atualizar contrato de cliente com plano
 */
export async function updateClientePlano(
  id: string,
  input: ClientePlanoUpdateInput
): Promise<ClientePlano> {
  try {
    // Buscar contrato atual para verificar mudanças de status
    const { data: contratoAtual } = await supabase
      .from('cliente_planos')
      .select('status')
      .eq('id', id)
      .single()

    const updateData: any = {}

    if (input.valor !== undefined) updateData.valor = input.valor
    if (input.moeda !== undefined) updateData.moeda = input.moeda
    if (input.status !== undefined) updateData.status = input.status
    if (input.data_inicio !== undefined) updateData.data_inicio = input.data_inicio || null
    if (input.data_fim !== undefined) updateData.data_fim = input.data_fim || null
    if (input.observacoes !== undefined) updateData.observacoes = input.observacoes || null

    const { data, error } = await supabase
      .from('cliente_planos')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select(
        `
        *,
        cliente:clientes(id, nome),
        plano:planos(*)
      `
      )
      .single()

    if (error) {
      console.error('Erro ao atualizar contrato de plano:', error)
      throw error
    }

    const contrato: ClientePlano = {
      id: data.id,
      cliente_id: data.cliente_id,
      plano_id: data.plano_id,
      valor: Number(data.valor),
      moeda: data.moeda,
      status: data.status,
      data_inicio: data.data_inicio || undefined,
      data_fim: data.data_fim || undefined,
      observacoes: data.observacoes || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
      cliente: data.cliente
        ? ({
            id: data.cliente.id,
            nome: data.cliente.nome,
          } as Cliente)
        : undefined,
      plano: data.plano
        ? {
            id: data.plano.id,
            nome: data.plano.nome,
            descricao: data.plano.descricao || undefined,
            valor: Number(data.plano.valor),
            moeda: data.plano.moeda,
            ativo: data.plano.ativo,
            created_at: data.plano.created_at,
            updated_at: data.plano.updated_at,
            deleted_at: data.plano.deleted_at || undefined,
          }
        : undefined,
    }

    // Atualizar transações futuras se o status mudou
    if (input.status !== undefined && contratoAtual && input.status !== contratoAtual.status) {
      try {
        const { atualizarTransacoesFuturasContrato } = await import('./financeiro')
        await atualizarTransacoesFuturasContrato(id, 'plano', input.status)
      } catch (error) {
        console.error('Erro ao atualizar transações futuras:', error)
        // Não falha a atualização do contrato se a atualização de transações falhar
      }
    }

    return contrato
  } catch (error) {
    console.error('Erro em updateClientePlano:', error)
    throw error
  }
}

/**
 * Soft delete de contrato de cliente com plano
 */
export async function deleteClientePlano(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('soft_delete_cliente_plano', { contrato_id: id })

    if (error) {
      console.error('Erro ao deletar contrato de plano:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro em deleteClientePlano:', error)
    throw error
  }
}

// ============================================================================
// CONTRATOS CLIENTE-SERVIÇOS AVULSOS
// ============================================================================

/**
 * Buscar contratos de serviços avulsos de um cliente
 */
export async function fetchClienteServicos(clienteId: string): Promise<ClienteServico[]> {
  try {
    const { data, error } = await supabase
      .from('cliente_servicos')
      .select(
        `
        *,
        cliente:clientes(id, nome),
        servico:servicos(*)
      `
      )
      .eq('cliente_id', clienteId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar contratos de serviços:', error)
      throw error
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      cliente_id: item.cliente_id,
      servico_id: item.servico_id,
      valor: Number(item.valor),
      moeda: item.moeda,
      status: item.status,
      data_inicio: item.data_inicio || undefined,
      data_fim: item.data_fim || undefined,
      observacoes: item.observacoes || undefined,
      created_at: item.created_at,
      updated_at: item.updated_at,
      deleted_at: item.deleted_at || undefined,
      cliente: item.cliente
        ? ({
            id: item.cliente.id,
            nome: item.cliente.nome,
          } as Cliente)
        : undefined,
      servico: item.servico
        ? {
            id: item.servico.id,
            nome: item.servico.nome,
            descricao: item.servico.descricao || undefined,
            valor: item.servico.valor ? Number(item.servico.valor) : undefined,
            ativo: item.servico.ativo,
            created_at: item.servico.created_at,
            updated_at: item.servico.updated_at,
            deleted_at: item.servico.deleted_at || undefined,
          }
        : undefined,
    }))
  } catch (error) {
    console.error('Erro em fetchClienteServicos:', error)
    throw error
  }
}

/**
 * Criar contrato de cliente com serviço avulso
 */
export async function createClienteServico(input: ClienteServicoCreateInput): Promise<ClienteServico> {
  try {
    const { data, error } = await supabase
      .from('cliente_servicos')
      .insert({
        cliente_id: input.cliente_id,
        servico_id: input.servico_id,
        valor: input.valor,
        moeda: input.moeda || 'BRL',
        status: input.status || 'ativo',
        data_inicio: input.data_inicio || null,
        data_fim: input.data_fim || null,
        observacoes: input.observacoes || null,
      })
      .select(
        `
        *,
        cliente:clientes(id, nome),
        servico:servicos(*)
      `
      )
      .single()

    if (error) {
      console.error('Erro ao criar contrato de serviço:', error)
      throw error
    }

    const contrato: ClienteServico = {
      id: data.id,
      cliente_id: data.cliente_id,
      servico_id: data.servico_id,
      valor: Number(data.valor),
      moeda: data.moeda,
      status: data.status,
      data_inicio: data.data_inicio || undefined,
      data_fim: data.data_fim || undefined,
      observacoes: data.observacoes || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
      cliente: data.cliente
        ? ({
            id: data.cliente.id,
            nome: data.cliente.nome,
          } as Cliente)
        : undefined,
      servico: data.servico
        ? {
            id: data.servico.id,
            nome: data.servico.nome,
            descricao: data.servico.descricao || undefined,
            valor: data.servico.valor ? Number(data.servico.valor) : undefined,
            ativo: data.servico.ativo,
            created_at: data.servico.created_at,
            updated_at: data.servico.updated_at,
            deleted_at: data.servico.deleted_at || undefined,
          }
        : undefined,
    }

    // Gerar transações automáticas se tiver data de início
    if (contrato.data_inicio) {
      try {
        const { gerarTransacoesContratoServico } = await import('./financeiro')
        await gerarTransacoesContratoServico(contrato)
      } catch (error) {
        console.error('Erro ao gerar transações automáticas:', error)
        // Não falha a criação do contrato se a geração de transações falhar
      }
    }

    return contrato
  } catch (error) {
    console.error('Erro em createClienteServico:', error)
    throw error
  }
}

/**
 * Atualizar contrato de cliente com serviço avulso
 */
export async function updateClienteServico(
  id: string,
  input: ClienteServicoUpdateInput
): Promise<ClienteServico> {
  try {
    // Buscar contrato atual para verificar mudanças de status
    const { data: contratoAtual } = await supabase
      .from('cliente_servicos')
      .select('status')
      .eq('id', id)
      .single()

    const updateData: any = {}

    if (input.valor !== undefined) updateData.valor = input.valor
    if (input.moeda !== undefined) updateData.moeda = input.moeda
    if (input.status !== undefined) updateData.status = input.status
    if (input.data_inicio !== undefined) updateData.data_inicio = input.data_inicio || null
    if (input.data_fim !== undefined) updateData.data_fim = input.data_fim || null
    if (input.observacoes !== undefined) updateData.observacoes = input.observacoes || null

    const { data, error } = await supabase
      .from('cliente_servicos')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select(
        `
        *,
        cliente:clientes(id, nome),
        servico:servicos(*)
      `
      )
      .single()

    if (error) {
      console.error('Erro ao atualizar contrato de serviço:', error)
      throw error
    }

    const contrato: ClienteServico = {
      id: data.id,
      cliente_id: data.cliente_id,
      servico_id: data.servico_id,
      valor: Number(data.valor),
      moeda: data.moeda,
      status: data.status,
      data_inicio: data.data_inicio || undefined,
      data_fim: data.data_fim || undefined,
      observacoes: data.observacoes || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
      cliente: data.cliente
        ? ({
            id: data.cliente.id,
            nome: data.cliente.nome,
          } as Cliente)
        : undefined,
      servico: data.servico
        ? {
            id: data.servico.id,
            nome: data.servico.nome,
            descricao: data.servico.descricao || undefined,
            valor: data.servico.valor ? Number(data.servico.valor) : undefined,
            ativo: data.servico.ativo,
            created_at: data.servico.created_at,
            updated_at: data.servico.updated_at,
            deleted_at: data.servico.deleted_at || undefined,
          }
        : undefined,
    }

    // Atualizar transações futuras se o status mudou
    if (input.status !== undefined && contratoAtual && input.status !== contratoAtual.status) {
      try {
        const { atualizarTransacoesFuturasContrato } = await import('./financeiro')
        await atualizarTransacoesFuturasContrato(id, 'servico', input.status)
      } catch (error) {
        console.error('Erro ao atualizar transações futuras:', error)
        // Não falha a atualização do contrato se a atualização de transações falhar
      }
    }

    return contrato
  } catch (error) {
    console.error('Erro em updateClienteServico:', error)
    throw error
  }
}

/**
 * Soft delete de contrato de cliente com serviço avulso
 */
export async function deleteClienteServico(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('soft_delete_cliente_servico', { contrato_id: id })

    if (error) {
      console.error('Erro ao deletar contrato de serviço:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro em deleteClienteServico:', error)
    throw error
  }
}
