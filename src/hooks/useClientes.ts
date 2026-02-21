import { useState, useEffect, useCallback } from 'react'
import { Cliente } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { fetchClientes, ClienteFilters, ClientesResponse } from '@/services/clientes'

interface UseClientesOptions extends ClienteFilters {
  autoFetch?: boolean
}

interface UseClientesReturn {
  clientes: Cliente[]
  loading: boolean
  error: Error | null
  total: number
  page: number
  pageSize: number
  refetch: () => Promise<void>
  setFilters: (filters: ClienteFilters) => void
  nextPage: () => void
  previousPage: () => void
  goToPage: (page: number) => void
}

/**
 * Hook para gerenciar listagem de clientes
 */
/**
 * Perfil de agente operacional: vê apenas clientes em que é o responsável.
 * Admin e demais perfis veem todos (respeitando filtros da UI).
 */
function isAgenteRestrito(perfil: string | undefined): boolean {
  return perfil === 'agente'
}

export function useClientes(options: UseClientesOptions = {}): UseClientesReturn {
  const { user } = useAuth()
  const { autoFetch = true, ...filters } = options

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(filters.limit || 50)
  const [currentFilters, setCurrentFilters] = useState<ClienteFilters>(filters)

  useEffect(() => {
    setCurrentFilters((prev) => ({ ...prev, ...filters }))
    setPage(1)
  }, [filters.status, filters.responsavel_id, filters.search, filters.smartConditions])

  const loadClientes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const effectiveFilters: ClienteFilters = {
        ...currentFilters,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }
      if (isAgenteRestrito(user?.perfil) && user?.id) {
        effectiveFilters.responsavel_id = user.id
      }

      const response: ClientesResponse = await fetchClientes(effectiveFilters)

      setClientes(response.data)
      setTotal(response.total)
      setPage(response.page)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao carregar clientes')
      setError(error)
      console.error('Erro em useClientes:', err)
    } finally {
      setLoading(false)
    }
  }, [currentFilters, page, pageSize, user?.id, user?.perfil])

  useEffect(() => {
    if (autoFetch) {
      loadClientes()
    }
  }, [autoFetch, loadClientes])

  const refetch = useCallback(async () => {
    await loadClientes()
  }, [loadClientes])

  const setFilters = useCallback((newFilters: ClienteFilters) => {
    setCurrentFilters(newFilters)
    setPage(1) // Resetar para primeira página ao filtrar
  }, [])

  const nextPage = useCallback(() => {
    const totalPages = Math.ceil(total / pageSize)
    if (page < totalPages) {
      setPage((prev) => prev + 1)
    }
  }, [page, total, pageSize])

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage((prev) => prev - 1)
    }
  }, [page])

  const goToPage = useCallback((newPage: number) => {
    const totalPages = Math.ceil(total / pageSize)
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }, [total, pageSize])

  return {
    clientes,
    loading,
    error,
    total,
    page,
    pageSize,
    refetch,
    setFilters,
    nextPage,
    previousPage,
    goToPage,
  }
}
