import { useState, useEffect, useCallback } from 'react'
import { fetchDashboardData, type DashboardStats } from '@/services/dashboard'

export interface UseDashboardOptions {
  /** Quando true, não busca dados financeiros (transações). Use para usuários sem permissão no módulo Financeiro. */
  skipFinance?: boolean
  /** Quando informado (ex.: perfil agente), dashboard mostra apenas clientes desse responsável. */
  responsavelId?: string
}

export function useDashboard(options?: UseDashboardOptions) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const skipFinance = options?.skipFinance === true
  const responsavelId = options?.responsavelId

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchDashboardData({ skipFinance, responsavelId })
      setStats(data)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Erro ao carregar dashboard'))
      console.error('useDashboard:', e)
    } finally {
      setLoading(false)
    }
  }, [skipFinance, responsavelId])

  useEffect(() => {
    load()
  }, [load])

  return { stats, loading, error, refetch: load }
}
