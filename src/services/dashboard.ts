import { fetchClientes } from './clientes'
import { fetchTransacoes } from './financeiro'
import { fetchOcorrencias } from './ocorrencias'
import { fetchResponsaveisParaDashboard, fetchPrincipaisParaLista } from './usuarios'
import { fetchTodosContratosPlanos } from './planos'
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
  /** Dados para o painel de contratos (por responsável e por vencimento). */
  contratos: {
    porResponsavel: Array<{
      responsavelId: string
      responsavelNome: string
      total: number
      ativos: number
      vencidos: number
      pertoVencer30: number
      pertoVencer60: number
      pertoVencer90: number
      apos90: number
      semData: number
    }>
    porFaixaVencimento: Array<{ faixa: string; count: number; ordem: number }>
    /** Faixas por responsável, para filtrar o gráfico de vencimento por agente. */
    faixasPorResponsavel: Record<string, { vencidos: number; proximos30: number; proximos60: number; proximos90: number; apos90: number; semData: number }>
    responsaveisUnicos: Array<{ responsavelId: string; responsavelNome: string }>
  }
}

export interface FetchDashboardOptions {
  skipFinance?: boolean
  /** Quando informado (ex.: perfil agente), restringe clientes ao responsável. */
  responsavelId?: string
}

export async function fetchDashboardData(options?: FetchDashboardOptions): Promise<DashboardStats> {
  const skipFinance = options?.skipFinance === true
  const responsavelId = options?.responsavelId

  const [clientesRes, transacoesRes, ocorrencias, responsaveis, contratosPlanos, principais] = await Promise.all([
    fetchClientes({
      limit: 5000,
      offset: 0,
      ...(responsavelId ? { responsavel_id: responsavelId } : {}),
    }),
    skipFinance ? Promise.resolve({ transacoes: [], total: 0 }) : fetchTransacoes({ tipo: 'receita', limit: 10000, offset: 0 }),
    fetchOcorrencias(),
    fetchResponsaveisParaDashboard(),
    fetchTodosContratosPlanos(),
    fetchPrincipaisParaLista(),
  ])

  const clientes = clientesRes.data
  const totalClientes = clientesRes.total
  const transacoes = transacoesRes.transacoes
  const userMap = new Map(responsaveis.map((r) => [r.id, r.name]))
  // Prefer nome from principais (aba Responsáveis) when available
  for (const p of principais) {
    if (p.responsavel_id && p.responsavel_name) userMap.set(p.responsavel_id, p.responsavel_name)
  }

  // Responsável do cliente: apenas principal (cliente_responsaveis) — fonte única
  const principalByCliente = new Map(principais.map((p) => [p.cliente_id, p.responsavel_id]))
  const getResponsavelId = (clienteId: string) => principalByCliente.get(clienteId) ?? ''

  const ativos = clientes.filter((c) => c.status === 'ativo').length
  const inativos = clientes.filter((c) => c.status === 'inativo').length
  const pausados = clientes.filter((c) => c.status === 'pausado').length

  const porResponsavel = new Map<string, { total: number; ativos: number }>()
  for (const c of clientes) {
    const key = getResponsavelId(c.id)
    const r = porResponsavel.get(key) ?? { total: 0, ativos: 0 }
    r.total++
    if (c.status === 'ativo') r.ativos++
    porResponsavel.set(key, r)
  }

  const clienteToResponsavel = new Map(clientes.map((c) => [c.id, getResponsavelId(c.id)]))

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

  // Contratos: cliente_id -> responsavel
  const clienteToResp = new Map(principais.map((p) => [p.cliente_id, { id: p.responsavel_id, nome: p.responsavel_name }]))
  const addDays = (base: string, n: number) => {
    const d = new Date(base + 'T12:00:00')
    d.setDate(d.getDate() + n)
    return d.toISOString().slice(0, 10)
  }
  const d30 = addDays(hojeStr, 30)
  const d60 = addDays(hojeStr, 60)
  const d90 = addDays(hojeStr, 90)

  const contratosFiltrados = responsavelId
    ? contratosPlanos.filter((c) => clienteToResp.get(c.cliente_id)?.id === responsavelId)
    : contratosPlanos

  const porRespContratos = new Map<
    string,
    { total: number; ativos: number; vencidos: number; pertoVencer30: number; pertoVencer60: number; pertoVencer90: number; apos90: number; semData: number }
  >()
  const faixasCount = {
    vencidos: 0,
    proximos30: 0,
    proximos60: 0,
    proximos90: 0,
    apos90: 0,
    semData: 0,
  }
  const faixasPerResp = new Map<
    string,
    { vencidos: number; proximos30: number; proximos60: number; proximos90: number; apos90: number; semData: number }
  >()

  const ensureFaixas = (rid: string) => {
    if (!faixasPerResp.has(rid)) {
      faixasPerResp.set(rid, { vencidos: 0, proximos30: 0, proximos60: 0, proximos90: 0, apos90: 0, semData: 0 })
    }
    return faixasPerResp.get(rid)!
  }

  for (const c of contratosFiltrados) {
    const r = clienteToResp.get(c.cliente_id)
    const rid = r?.id ?? ''
    if (!porRespContratos.has(rid)) {
      porRespContratos.set(rid, {
        total: 0,
        ativos: 0,
        vencidos: 0,
        pertoVencer30: 0,
        pertoVencer60: 0,
        pertoVencer90: 0,
        apos90: 0,
        semData: 0,
      })
    }
    const pr = porRespContratos.get(rid)!
    pr.total++
    if (c.status === 'ativo') pr.ativos++
    const df = c.data_fim
    const fr = ensureFaixas(rid)
    if (!df) {
      pr.semData++
      faixasCount.semData++
      fr.semData++
    } else {
      if (df < hojeStr) {
        pr.vencidos++
        faixasCount.vencidos++
        fr.vencidos++
      } else if (df <= d30) {
        pr.pertoVencer30++
        faixasCount.proximos30++
        fr.proximos30++
      } else if (df <= d60) {
        pr.pertoVencer60++
        faixasCount.proximos60++
        fr.proximos60++
      } else if (df <= d90) {
        pr.pertoVencer90++
        faixasCount.proximos90++
        fr.proximos90++
      } else {
        pr.apos90++
        faixasCount.apos90++
        fr.apos90++
      }
    }
  }

  const faixasPorResponsavel: Record<string, { vencidos: number; proximos30: number; proximos60: number; proximos90: number; apos90: number; semData: number }> = {}
  faixasPerResp.forEach((v, k) => {
    faixasPorResponsavel[k] = v
  })

  const responsaveisUnicosMap = new Map<string, string>()
  for (const p of principais) {
    if (p.responsavel_id && !responsaveisUnicosMap.has(p.responsavel_id))
      responsaveisUnicosMap.set(p.responsavel_id, p.responsavel_name || 'Sem responsável')
  }
  const responsaveisUnicos = [...porRespContratos.entries()].map(([responsavelId]) => ({
    responsavelId,
    responsavelNome: responsaveisUnicosMap.get(responsavelId) ?? userMap.get(responsavelId) ?? 'Sem responsável',
  }))
  const responsaveisUnicosDedup = responsaveisUnicos.filter(
    (r, i, arr) => arr.findIndex((x) => x.responsavelId === r.responsavelId) === i
  )

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
    contratos: {
      porResponsavel: [...porRespContratos.entries()].map(([responsavelId, v]) => ({
        responsavelId,
        responsavelNome: userMap.get(responsavelId) ?? 'Sem responsável',
        ...v,
      })),
      porFaixaVencimento: [
        { faixa: 'Vencidos', count: faixasCount.vencidos, ordem: 0 },
        { faixa: 'Próximos 30 dias', count: faixasCount.proximos30, ordem: 1 },
        { faixa: '31 a 60 dias', count: faixasCount.proximos60, ordem: 2 },
        { faixa: '61 a 90 dias', count: faixasCount.proximos90, ordem: 3 },
        { faixa: 'Após 90 dias', count: faixasCount.apos90, ordem: 4 },
        { faixa: 'Sem data fim', count: faixasCount.semData, ordem: 5 },
      ].sort((a, b) => a.ordem - b.ordem),
      faixasPorResponsavel,
      responsaveisUnicos: responsaveisUnicosDedup,
    },
  }
}
