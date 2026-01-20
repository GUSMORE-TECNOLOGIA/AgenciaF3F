import { useState, useEffect, useCallback } from 'react'
import { Cliente, LinksUteis } from '@/types'
import {
  fetchClienteById,
  createCliente,
  updateCliente,
  updateLinksUteis,
  updateClienteStatus,
  deleteCliente,
} from '@/services/clientes'
import type { ClienteCreateInput, ClienteUpdateInput } from '@/lib/validators/cliente-schema'

interface UseClienteReturn {
  cliente: Cliente | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

interface UseCreateClienteReturn {
  create: (input: ClienteCreateInput) => Promise<Cliente>
  loading: boolean
  error: Error | null
}

interface UseUpdateClienteReturn {
  update: (input: ClienteUpdateInput) => Promise<Cliente>
  loading: boolean
  error: Error | null
}

interface UseUpdateLinksUteisReturn {
  update: (links: LinksUteis) => Promise<Cliente>
  loading: boolean
  error: Error | null
}

interface UseUpdateStatusReturn {
  update: (status: 'ativo' | 'inativo' | 'pausado') => Promise<Cliente>
  loading: boolean
  error: Error | null
}

interface UseDeleteClienteReturn {
  remove: () => Promise<void>
  loading: boolean
  error: Error | null
}

/**
 * Hook para buscar um cliente específico
 */
export function useCliente(id: string | null): UseClienteReturn {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadCliente = useCallback(async () => {
    if (!id) {
      setCliente(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await fetchClienteById(id)
      setCliente(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao carregar cliente')
      setError(error)
      console.error('Erro em useCliente:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadCliente()
  }, [loadCliente])

  return {
    cliente,
    loading,
    error,
    refetch: loadCliente,
  }
}

/**
 * Hook para criar um novo cliente
 */
export function useCreateCliente(): UseCreateClienteReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (input: ClienteCreateInput): Promise<Cliente> => {
    try {
      setLoading(true)
      setError(null)
      const cliente = await createCliente(input)
      return cliente
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao criar cliente')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    create,
    loading,
    error,
  }
}

/**
 * Hook para atualizar um cliente existente
 */
export function useUpdateCliente(clienteId: string): UseUpdateClienteReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(
    async (input: ClienteUpdateInput): Promise<Cliente> => {
      try {
        setLoading(true)
        setError(null)
        const cliente = await updateCliente(clienteId, input)
        return cliente
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao atualizar cliente')
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [clienteId]
  )

  return {
    update,
    loading,
    error,
  }
}

/**
 * Hook para atualizar apenas links úteis
 */
export function useUpdateLinksUteis(clienteId: string): UseUpdateLinksUteisReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(
    async (links: LinksUteis): Promise<Cliente> => {
      try {
        setLoading(true)
        setError(null)
        const cliente = await updateLinksUteis(clienteId, links)
        return cliente
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao atualizar links úteis')
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [clienteId]
  )

  return {
    update,
    loading,
    error,
  }
}

/**
 * Hook para atualizar apenas status
 */
export function useUpdateClienteStatus(clienteId: string): UseUpdateStatusReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(
    async (status: 'ativo' | 'inativo' | 'pausado'): Promise<Cliente> => {
      try {
        setLoading(true)
        setError(null)
        const cliente = await updateClienteStatus(clienteId, status)
        return cliente
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao atualizar status')
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [clienteId]
  )

  return {
    update,
    loading,
    error,
  }
}

/**
 * Hook para deletar (soft delete) um cliente
 */
export function useDeleteCliente(clienteId: string): UseDeleteClienteReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await deleteCliente(clienteId)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao deletar cliente')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  return {
    remove,
    loading,
    error,
  }
}
