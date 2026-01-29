import { useState, useEffect, useCallback } from 'react'
import { fetchDashboardData, type DashboardStats } from '@/services/dashboard'

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchDashboardData()
      setStats(data)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Erro ao carregar dashboard'))
      console.error('useDashboard:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { stats, loading, error, refetch: load }
}
