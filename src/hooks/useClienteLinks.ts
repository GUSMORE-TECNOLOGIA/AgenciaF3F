import { useState, useCallback } from 'react'
import { ClienteLink } from '@/types'
import {
  fetchClienteLinks,
  createClienteLink,
  updateClienteLink,
  deleteClienteLink,
} from '@/services/clienteLinks'

export function useClienteLinks(clienteId: string) {
  const [links, setLinks] = useState<ClienteLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadLinks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchClienteLinks(clienteId)
      setLinks(data)
      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao carregar links')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  const create = useCallback(
    async (input: {
      url: string
      tipo: string
      pessoa?: string
      status?: 'ativo' | 'inativo'
    }): Promise<ClienteLink> => {
      try {
        setLoading(true)
        setError(null)
        const newLink = await createClienteLink({
          cliente_id: clienteId,
          ...input,
        })
        setLinks((prev) => [newLink, ...prev])
        return newLink
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao criar link')
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [clienteId]
  )

  const update = useCallback(
    async (
      id: string,
      input: {
        url?: string
        tipo?: string
        pessoa?: string
        status?: 'ativo' | 'inativo'
      }
    ): Promise<ClienteLink> => {
      try {
        setLoading(true)
        setError(null)
        const updatedLink = await updateClienteLink(id, input)
        setLinks((prev) => prev.map((link) => (link.id === id ? updatedLink : link)))
        return updatedLink
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao atualizar link')
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await deleteClienteLink(id)
      setLinks((prev) => prev.filter((link) => link.id !== id))
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao deletar link')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    links,
    loading,
    error,
    loadLinks,
    create,
    update,
    remove,
  }
}
