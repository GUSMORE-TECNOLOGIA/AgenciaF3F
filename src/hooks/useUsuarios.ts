import { useState, useEffect, useCallback } from 'react'
import { User } from '@/types'
import { fetchUsuarios, fetchUsuarioById, fetchUsuariosParaSelecaoResponsavel } from '@/services/usuarios'

export type UsuarioParaSelecao = { id: string; email: string; name: string }

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchUsuarios()
      setUsuarios(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar usuários:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsuarios()
  }, [loadUsuarios])

  return { usuarios, loading, error, refetch: loadUsuarios }
}

/** Lista para dropdown "Responsável" com nome completo (equipe_membros.nome_completo ou usuarios.name). */
export function useUsuariosParaSelecaoResponsavel() {
  const [usuarios, setUsuarios] = useState<UsuarioParaSelecao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchUsuariosParaSelecaoResponsavel()
      setUsuarios(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar usuários para seleção:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { usuarios, loading, error, refetch }
}

export function useUsuario(id: string | null) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadUsuario = useCallback(async () => {
    if (!id) {
      setUsuario(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await fetchUsuarioById(id)
      setUsuario(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar usuário:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadUsuario()
  }, [loadUsuario])

  return { usuario, loading, error, refetch: loadUsuario }
}
