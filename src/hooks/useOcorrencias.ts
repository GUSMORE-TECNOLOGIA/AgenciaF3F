import { useState, useEffect, useCallback } from 'react'
import { Ocorrencia, OcorrenciaGrupo, OcorrenciaTipo } from '@/types'
import {
  fetchOcorrencias,
  fetchOcorrenciaById,
  createOcorrencia,
  updateOcorrencia,
  deleteOcorrencia,
  fetchOcorrenciaGrupos,
  fetchOcorrenciaTipos,
  createOcorrenciaGrupo,
  updateOcorrenciaGrupo,
  deleteOcorrenciaGrupo,
  createOcorrenciaTipo,
  updateOcorrenciaTipo,
  deleteOcorrenciaTipo,
  type OcorrenciaCreateInput,
  type OcorrenciaUpdateInput,
  type OcorrenciaFilters,
  type OcorrenciaGrupoInput,
  type OcorrenciaTipoInput,
} from '@/services/ocorrencias'

export function useOcorrencias(filtros?: OcorrenciaFilters) {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadOcorrencias = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchOcorrencias(filtros)
      setOcorrencias(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar ocorrências:', err)
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    loadOcorrencias()
  }, [loadOcorrencias])

  return { ocorrencias, loading, error, refetch: loadOcorrencias }
}

export function useOcorrencia(id: string | null) {
  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadOcorrencia = useCallback(async () => {
    if (!id) {
      setOcorrencia(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await fetchOcorrenciaById(id)
      setOcorrencia(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar ocorrência:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadOcorrencia()
  }, [loadOcorrencia])

  return { ocorrencia, loading, error, refetch: loadOcorrencia }
}

export function useCreateOcorrencia() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (input: OcorrenciaCreateInput): Promise<Ocorrencia> => {
    try {
      setLoading(true)
      setError(null)
      return await createOcorrencia(input)
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

export function useUpdateOcorrencia(id: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(async (input: OcorrenciaUpdateInput): Promise<Ocorrencia> => {
    try {
      setLoading(true)
      setError(null)
      return await updateOcorrencia(id, input)
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

export function useDeleteOcorrencia() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await deleteOcorrencia(id)
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

export function useOcorrenciaGrupos(params?: { responsavelId?: string; includeInactive?: boolean }) {
  const [grupos, setGrupos] = useState<OcorrenciaGrupo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const paramsKey = JSON.stringify(params || {})

  const loadGrupos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchOcorrenciaGrupos(params)
      setGrupos(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar grupos:', err)
    } finally {
      setLoading(false)
    }
  }, [paramsKey])

  useEffect(() => {
    loadGrupos()
  }, [loadGrupos])

  return { grupos, loading, error, refetch: loadGrupos }
}

export function useOcorrenciaTipos(params?: { grupoId?: string; includeInactive?: boolean }) {
  const [tipos, setTipos] = useState<OcorrenciaTipo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const paramsKey = JSON.stringify(params || {})

  const loadTipos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchOcorrenciaTipos(params)
      setTipos(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar tipos:', err)
    } finally {
      setLoading(false)
    }
  }, [paramsKey])

  useEffect(() => {
    loadTipos()
  }, [loadTipos])

  return { tipos, loading, error, refetch: loadTipos }
}

export function useCreateOcorrenciaGrupo() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (input: OcorrenciaGrupoInput): Promise<OcorrenciaGrupo> => {
    try {
      setLoading(true)
      setError(null)
      return await createOcorrenciaGrupo(input)
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

export function useUpdateOcorrenciaGrupo(id: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(async (input: Partial<OcorrenciaGrupoInput>): Promise<OcorrenciaGrupo> => {
    try {
      setLoading(true)
      setError(null)
      return await updateOcorrenciaGrupo(id, input)
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

export function useDeleteOcorrenciaGrupo() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await deleteOcorrenciaGrupo(id)
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

export function useCreateOcorrenciaTipo() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (input: OcorrenciaTipoInput): Promise<OcorrenciaTipo> => {
    try {
      setLoading(true)
      setError(null)
      return await createOcorrenciaTipo(input)
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

export function useUpdateOcorrenciaTipo(id: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(async (input: Partial<OcorrenciaTipoInput>): Promise<OcorrenciaTipo> => {
    try {
      setLoading(true)
      setError(null)
      return await updateOcorrenciaTipo(id, input)
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

export function useDeleteOcorrenciaTipo() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await deleteOcorrenciaTipo(id)
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
