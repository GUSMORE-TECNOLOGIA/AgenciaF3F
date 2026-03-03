import { useState, useEffect, useCallback } from 'react'
import { Transacao } from '@/types'
import {
  fetchTransacoes,
  fetchTransacaoById,
  fetchTransacoesCliente,
  updateTransacao,
  deleteTransacao,
  baixarTitulo,
  calcularPrevisaoRecebimento,
  fetchFontesFinanceirasCliente,
  gerarLancamentoClienteIndividual,
  gerarLancamentosClienteLote,
  type FinanceiroFonteCliente,
  type GerarLancamentoIndividualInput,
  type GerarLancamentosLoteInput,
  type GeracaoLoteResultado,
} from '@/services/financeiro'
import { createTransacao, type TransacaoCreateInput } from '@/services/transacoes'

export interface TransacaoFilters {
  clienteId?: string
  tipo?: 'receita' | 'despesa'
  status?: 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado'
  dataInicio?: string
  dataFim?: string
}

export function useTransacoes(filtros?: TransacaoFilters) {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)

  const clienteId = filtros?.clienteId
  const tipo = filtros?.tipo
  const status = filtros?.status
  const dataInicio = filtros?.dataInicio
  const dataFim = filtros?.dataFim

  const loadTransacoes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchTransacoes({
        clienteId,
        tipo,
        status,
        dataInicio,
        dataFim,
        limit: 50,
        offset: 0,
      })
      setTransacoes(response.transacoes)
      setTotal(response.total)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar transações:', err)
    } finally {
      setLoading(false)
    }
  }, [clienteId, tipo, status, dataInicio, dataFim])

  useEffect(() => {
    loadTransacoes()
  }, [loadTransacoes])

  return { transacoes, loading, error, total, refetch: loadTransacoes }
}

export function useTransacao(id: string | null) {
  const [transacao, setTransacao] = useState<Transacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadTransacao = useCallback(async () => {
    if (!id) {
      setTransacao(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await fetchTransacaoById(id)
      setTransacao(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar transação:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadTransacao()
  }, [loadTransacao])

  return { transacao, loading, error, refetch: loadTransacao }
}

export function useTransacoesCliente(clienteId: string | null, filtros?: TransacaoFilters) {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const tipo = filtros?.tipo
  const status = filtros?.status
  const dataInicio = filtros?.dataInicio
  const dataFim = filtros?.dataFim

  const loadTransacoes = useCallback(async () => {
    if (!clienteId) {
      setTransacoes([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await fetchTransacoesCliente(clienteId, {
        tipo,
        status,
        dataInicio,
        dataFim,
      })
      setTransacoes(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar transações do cliente:', err)
    } finally {
      setLoading(false)
    }
  }, [clienteId, tipo, status, dataInicio, dataFim])

  useEffect(() => {
    loadTransacoes()
  }, [loadTransacoes])

  return { transacoes, loading, error, refetch: loadTransacoes }
}

export function useCreateTransacao() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (input: TransacaoCreateInput): Promise<Transacao> => {
    try {
      setLoading(true)
      setError(null)
      return await createTransacao(input)
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

export function useUpdateTransacao() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(
    async (
      id: string,
      updates: {
        valor?: number
        descricao?: string
        status?: 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado'
        data_vencimento?: string
        data_pagamento?: string
        metodo_pagamento?: string
      }
    ): Promise<Transacao> => {
      try {
        setLoading(true)
        setError(null)
        return await updateTransacao(id, updates)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro desconhecido')
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { update, loading, error }
}

export function useDeleteTransacao() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await deleteTransacao(id)
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

export function useBaixarTitulo() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const baixar = useCallback(
    async (transacaoId: string, dataPagamento: string, metodoPagamento?: string): Promise<Transacao> => {
      try {
        setLoading(true)
        setError(null)
        return await baixarTitulo(transacaoId, dataPagamento, metodoPagamento)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro desconhecido')
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { baixar, loading, error }
}

export function usePrevisaoRecebimento(clienteId: string | null) {
  const [previsao, setPrevisao] = useState<{
    totalPrevisto: number
    totalPago: number
    totalPendente: number
    transacoesPendentes: Transacao[]
    transacoesPagas: Transacao[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadPrevisao = useCallback(async () => {
    if (!clienteId) {
      setPrevisao(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await calcularPrevisaoRecebimento(clienteId)
      setPrevisao(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar previsão:', err)
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  useEffect(() => {
    loadPrevisao()
  }, [loadPrevisao])

  return { previsao, loading, error, refetch: loadPrevisao }
}

export function useFinanceiroFontesCliente(clienteId: string | null) {
  const [fontes, setFontes] = useState<FinanceiroFonteCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadFontes = useCallback(async () => {
    if (!clienteId) {
      setFontes([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const data = await fetchFontesFinanceirasCliente(clienteId)
      setFontes(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar fontes financeiras do cliente:', err)
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  useEffect(() => {
    loadFontes()
  }, [loadFontes])

  return { fontes, loading, error, refetch: loadFontes }
}

export function useGerarLancamentoFinanceiroIndividual() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const gerar = useCallback(async (input: GerarLancamentoIndividualInput) => {
    try {
      setLoading(true)
      setError(null)
      return await gerarLancamentoClienteIndividual(input)
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { gerar, loading, error }
}

export function useGerarLancamentosFinanceiroLote() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const gerar = useCallback(async (input: GerarLancamentosLoteInput): Promise<GeracaoLoteResultado> => {
    try {
      setLoading(true)
      setError(null)
      return await gerarLancamentosClienteLote(input)
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { gerar, loading, error }
}
