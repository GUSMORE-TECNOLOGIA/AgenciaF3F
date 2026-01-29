import { fetchClientes } from './clientes'
import { fetchTransacoes } from './financeiro'
import { fetchOcorrencias } from './ocorrencias'
import { fetchUsuarios } from './usuarios'
import type { Transacao } from '@/types'

const hoje = () => new Date().toISOString().slice(0, 10)
const startOfMonth = () => {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}
const endOfMonth = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  return d.toISOString().slice(0, 10)
}

export interface DashboardStats {
  clientes: {
    total: number
    ativos: number
    inativos: number
    pausados: number
    porResponsavel: Array<{ responsavelId: string; responsavelNome: string; total: number; ativos: number }>
  }
  financeiro: {
    receitaMes: number
    totalPago: number
    totalEmAbertos: number
    totalAtrasados: number
    provisaoFaturamento: number
    percAtrasados: number
    percEmAbertos: number
    atrasadosPorResponsavel: Array<{ responsavelId: string; responsavelNome: string; valor: number; qtd: number }>
    emAbertosPorResponsavel: Array<{ responsavelId: string; responsavelNome: string; valor: number; qtd: number }>
  }
  ocorrencias: {
    abertas: number
    emAndamento: number
  }
}

export async function fetchDashboardData(): Promise<DashboardStats> {
  const [clientesRes, transacoesRes, ocorrencias, usuarios] = await Promise.all([
    fetchClientes({ limit: 5000, offset: 0 }),
    fetchTransacoes({ tipo: 'receita', limit: 10000, offset: 0 }),
    fetchOcorrencias(),
    fetchUsuarios(),
  ])

  const clientes = clientesRes.data
  const totalClientes = clientesRes.total
  const transacoes = transacoesRes.transacoes
  const userMap = new Map(usuarios.map((u) => [u.id, u.name]))

  const ativos = clientes.filter((c) => c.status === 'ativo').length
  const inativos = clientes.filter((c) => c.status === 'inativo').length
  const pausados = clientes.filter((c) => c.status === 'pausado').length

  const porResponsavel = new Map<string, { total: number; ativos: number }>()
  for (const c of clientes) {
    const r = porResponsavel.get(c.responsavel_id) ?? { total: 0, ativos: 0 }
    r.total++
    if (c.status === 'ativo') r.ativos++
    porResponsavel.set(c.responsavel_id, r)
  }

  const clienteToResponsavel = new Map(clientes.map((c) => [c.id, c.responsavel_id]))

  const hojeStr = hoje()
  const mesInicio = startOfMonth()
  const mesFim = endOfMonth()

  let receitaMes = 0
  let totalPago = 0
  let totalEmAbertos = 0
  let totalAtrasados = 0
  let provisaoFaturamento = 0

  const atrasadosPorResp = new Map<string, { valor: number; qtd: number }>()
  const emAbertosPorResp = new Map<string, { valor: number; qtd: number }>()

  const isAtrasado = (t: Transacao) => {
    if (t.tipo !== 'receita') return false
    if (!['pendente', 'vencido'].includes(t.status)) return false
    return t.data_vencimento < hojeStr
  }

  const isEmAberto = (t: Transacao) => {
    if (t.tipo !== 'receita') return false
    return ['pendente', 'vencido'].includes(t.status)
  }

  for (const t of transacoes) {
    if (t.tipo !== 'receita') continue
    const rid = clienteToResponsavel.get(t.cliente_id) ?? ''
    const resp = (r: Map<string, { valor: number; qtd: number }>, v: number) => {
      const cur = r.get(rid) ?? { valor: 0, qtd: 0 }
      cur.valor += v
      cur.qtd += 1
      r.set(rid, cur)
    }

    if (t.status === 'pago' && t.data_pagamento) {
      const dp = t.data_pagamento.slice(0, 10)
      if (dp >= mesInicio && dp <= mesFim) receitaMes += t.valor
      totalPago += t.valor
    }
    if (isEmAberto(t)) {
      totalEmAbertos += t.valor
      resp(emAbertosPorResp, t.valor)
    }
    if (isAtrasado(t)) {
      totalAtrasados += t.valor
      resp(atrasadosPorResp, t.valor)
    }
    if (t.status === 'pendente' && t.data_vencimento >= hojeStr) {
      provisaoFaturamento += t.valor
    }
  }

  const totalRelevante = totalPago + totalEmAbertos || 1
  const percAtrasados = totalRelevante ? (totalAtrasados / totalRelevante) * 100 : 0
  const percEmAbertos = totalRelevante ? (totalEmAbertos / totalRelevante) * 100 : 0

  const ocorrenciasAbertas = ocorrencias.filter((o) => o.status === 'aberta').length
  const ocorrenciasEmAndamento = ocorrencias.filter((o) => o.status === 'em_andamento').length

  const byResp = (m: Map<string, { valor: number; qtd: number }>) =>
    [...m.entries()].map(([responsavelId, v]) => ({
      responsavelId,
      responsavelNome: userMap.get(responsavelId) ?? 'Sem responsável',
      valor: v.valor,
      qtd: v.qtd,
    }))

  return {
    clientes: {
      total: totalClientes,
      ativos,
      inativos,
      pausados,
      porResponsavel: [...porResponsavel.entries()].map(([responsavelId, v]) => ({
        responsavelId,
        responsavelNome: userMap.get(responsavelId) ?? 'Sem responsável',
        total: v.total,
        ativos: v.ativos,
      })),
    },
    financeiro: {
      receitaMes,
      totalPago,
      totalEmAbertos,
      totalAtrasados,
      provisaoFaturamento,
      percAtrasados,
      percEmAbertos,
      atrasadosPorResponsavel: byResp(atrasadosPorResp),
      emAbertosPorResponsavel: byResp(emAbertosPorResp),
    },
    ocorrencias: {
      abertas: ocorrenciasAbertas,
      emAndamento: ocorrenciasEmAndamento,
    },
  }
}
