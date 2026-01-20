import { useState, useEffect, useCallback } from 'react'
import { Servico, Plano, PlanoServico, ClientePlano, ClienteServico } from '@/types'
import {
  fetchServicos,
  fetchServicoById,
  createServico,
  updateServico,
  deleteServico,
  fetchPlanos,
  fetchPlanoById,
  createPlano,
  updatePlano,
  deletePlano,
  fetchPlanoServicos,
  addServicoToPlano,
  removeServicoFromPlano,
  updatePlanoServicosOrdem,
  fetchClientePlanos,
  createClientePlano,
  updateClientePlano,
  deleteClientePlano,
  fetchClienteServicos,
  createClienteServico,
  updateClienteServico,
  deleteClienteServico,
  ServicoCreateInput,
  ServicoUpdateInput,
  PlanoCreateInput,
  PlanoUpdateInput,
  PlanoServicoCreateInput,
  ClientePlanoCreateInput,
  ClientePlanoUpdateInput,
  ClienteServicoCreateInput,
  ClienteServicoUpdateInput,
} from '@/services/planos'

// ============================================================================
// HOOKS PARA SERVIÇOS MESTRES
// ============================================================================

export function useServicos(ativo?: boolean) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadServicos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchServicos(ativo)
      setServicos(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar serviços:', err)
    } finally {
      setLoading(false)
    }
  }, [ativo])

  useEffect(() => {
    loadServicos()
  }, [loadServicos])

  return { servicos, loading, error, refetch: loadServicos }
}

export function useServico(id: string | null) {
  const [servico, setServico] = useState<Servico | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadServico = useCallback(async () => {
    if (!id) {
      setServico(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await fetchServicoById(id)
      setServico(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar serviço:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadServico()
  }, [loadServico])

  return { servico, loading, error, refetch: loadServico }
}

export function useCreateServico() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (input: ServicoCreateInput): Promise<Servico> => {
    try {
      setLoading(true)
      setError(null)
      return await createServico(input)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { create, loading, error }
}

export function useUpdateServico(id: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(async (input: ServicoUpdateInput): Promise<Servico> => {
    try {
      setLoading(true)
      setError(null)
      return await updateServico(id, input)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [id])

  return { update, loading, error }
}

export function useDeleteServico() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await deleteServico(id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { remove, loading, error }
}

// ============================================================================
// HOOKS PARA PLANOS
// ============================================================================

export function usePlanos(ativo?: boolean) {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadPlanos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchPlanos(ativo)
      setPlanos(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar planos:', err)
    } finally {
      setLoading(false)
    }
  }, [ativo])

  useEffect(() => {
    loadPlanos()
  }, [loadPlanos])

  return { planos, loading, error, refetch: loadPlanos }
}

export function usePlano(id: string | null) {
  const [plano, setPlano] = useState<Plano | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadPlano = useCallback(async () => {
    if (!id) {
      setPlano(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await fetchPlanoById(id)
      setPlano(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar plano:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadPlano()
  }, [loadPlano])

  return { plano, loading, error, refetch: loadPlano }
}

export function useCreatePlano() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (input: PlanoCreateInput): Promise<Plano> => {
    try {
      setLoading(true)
      setError(null)
      return await createPlano(input)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { create, loading, error }
}

export function useUpdatePlano(id: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(async (input: PlanoUpdateInput): Promise<Plano> => {
    try {
      setLoading(true)
      setError(null)
      return await updatePlano(id, input)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [id])

  return { update, loading, error }
}

export function useDeletePlano() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await deletePlano(id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { remove, loading, error }
}

// ============================================================================
// HOOKS PARA RELAÇÃO PLANO-SERVIÇOS
// ============================================================================

export function usePlanoServicos(planoId: string | null) {
  const [planoServicos, setPlanoServicos] = useState<PlanoServico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadPlanoServicos = useCallback(async () => {
    if (!planoId) {
      setPlanoServicos([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await fetchPlanoServicos(planoId)
      setPlanoServicos(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar serviços do plano:', err)
    } finally {
      setLoading(false)
    }
  }, [planoId])

  useEffect(() => {
    loadPlanoServicos()
  }, [loadPlanoServicos])

  return { planoServicos, loading, error, refetch: loadPlanoServicos }
}

export function useAddServicoToPlano() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const add = useCallback(async (input: PlanoServicoCreateInput): Promise<PlanoServico> => {
    try {
      setLoading(true)
      setError(null)
      return await addServicoToPlano(input)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { add, loading, error }
}

export function useRemoveServicoFromPlano() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = useCallback(async (planoId: string, servicoId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await removeServicoFromPlano(planoId, servicoId)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { remove, loading, error }
}

// ============================================================================
// HOOKS PARA CONTRATOS CLIENTE-PLANOS
// ============================================================================

export function useClientePlanos(clienteId: string | null) {
  const [clientePlanos, setClientePlanos] = useState<ClientePlano[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadClientePlanos = useCallback(async () => {
    if (!clienteId) {
      setClientePlanos([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await fetchClientePlanos(clienteId)
      setClientePlanos(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar contratos de planos:', err)
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  useEffect(() => {
    loadClientePlanos()
  }, [loadClientePlanos])

  return { clientePlanos, loading, error, refetch: loadClientePlanos }
}

export function useCreateClientePlano() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (input: ClientePlanoCreateInput): Promise<ClientePlano> => {
    try {
      setLoading(true)
      setError(null)
      return await createClientePlano(input)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { create, loading, error }
}

export function useUpdateClientePlano(id: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(async (input: ClientePlanoUpdateInput): Promise<ClientePlano> => {
    try {
      setLoading(true)
      setError(null)
      return await updateClientePlano(id, input)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [id])

  return { update, loading, error }
}

export function useDeleteClientePlano() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await deleteClientePlano(id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { remove, loading, error }
}

// ============================================================================
// HOOKS PARA CONTRATOS CLIENTE-SERVIÇOS AVULSOS
// ============================================================================

export function useClienteServicos(clienteId: string | null) {
  const [clienteServicos, setClienteServicos] = useState<ClienteServico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadClienteServicos = useCallback(async () => {
    if (!clienteId) {
      setClienteServicos([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await fetchClienteServicos(clienteId)
      setClienteServicos(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar contratos de serviços:', err)
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  useEffect(() => {
    loadClienteServicos()
  }, [loadClienteServicos])

  return { clienteServicos, loading, error, refetch: loadClienteServicos }
}

export function useCreateClienteServico() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (input: ClienteServicoCreateInput): Promise<ClienteServico> => {
    try {
      setLoading(true)
      setError(null)
      return await createClienteServico(input)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { create, loading, error }
}

export function useUpdateClienteServico(id: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(async (input: ClienteServicoUpdateInput): Promise<ClienteServico> => {
    try {
      setLoading(true)
      setError(null)
      return await updateClienteServico(id, input)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [id])

  return { update, loading, error }
}

export function useDeleteClienteServico() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await deleteClienteServico(id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { remove, loading, error }
}
