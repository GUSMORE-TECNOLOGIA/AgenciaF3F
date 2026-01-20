import { useState, useEffect, useCallback } from 'react'
import { Atendimento } from '@/types'
import {
  fetchAtendimentos,
  fetchAtendimentoById,
  createAtendimento,
  updateAtendimento,
  deleteAtendimento,
  type AtendimentoCreateInput,
  type AtendimentoUpdateInput,
  type AtendimentoFilters,
} from '@/services/atendimentos'

export function useAtendimentos(filtros?: AtendimentoFilters) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadAtendimentos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAtendimentos(filtros)
      setAtendimentos(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar atendimentos:', err)
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    loadAtendimentos()
  }, [loadAtendimentos])

  return { atendimentos, loading, error, refetch: loadAtendimentos }
}

export function useAtendimento(id: string | null) {
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadAtendimento = useCallback(async () => {
    if (!id) {
      setAtendimento(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await fetchAtendimentoById(id)
      setAtendimento(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar atendimento:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadAtendimento()
  }, [loadAtendimento])

  return { atendimento, loading, error, refetch: loadAtendimento }
}

export function useCreateAtendimento() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (input: AtendimentoCreateInput): Promise<Atendimento> => {
    try {
      setLoading(true)
      setError(null)
      return await createAtendimento(input)
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

export function useUpdateAtendimento(id: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(async (input: AtendimentoUpdateInput): Promise<Atendimento> => {
    try {
      setLoading(true)
      setError(null)
      return await updateAtendimento(id, input)
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

export function useDeleteAtendimento() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await deleteAtendimento(id)
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
