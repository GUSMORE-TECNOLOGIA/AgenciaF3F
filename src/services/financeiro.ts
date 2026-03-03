import { supabase } from './supabase'
import { Transacao, ClientePlano, ClienteServico } from '@/types'
import { createTransacao } from './transacoes'

export interface FinanceiroFonteCliente {
  cliente_plano_id: string
  plano_id: string
  plano_nome: string
  plano_valor: number
  contrato_id?: string
  contrato_nome?: string
}

export interface GerarLancamentoIndividualInput {
  cliente_id: string
  categoria: string
  valor: number
  descricao: string
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado'
  data_vencimento: string
  origem: 'plano' | 'avulso'
  cliente_plano_id?: string
  contrato_id?: string
}

export interface GerarLancamentosLoteInput {
  cliente_id: string
  categoria: string
  valor: number
  descricao_base: string
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado'
  data_inicio: string
  data_fim: string
  dia_vencimento: number
  origem: 'plano' | 'avulso'
  cliente_plano_id?: string
  contrato_id?: string
}

export interface GeracaoLoteResultado {
  total_competencias: number
  criados: number
  ignorados: number
  competencias: string[]
  transacoes_ids: string[]
}

function clampDiaParaMes(year: number, monthZeroBased: number, diaDesejado: number): number {
  const lastDay = new Date(year, monthZeroBased + 1, 0).getDate()
  return Math.min(Math.max(1, diaDesejado), lastDay)
}

function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toYm(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function calcularCompetenciasMensais(
  dataInicio: string,
  dataFim: string,
  diaVencimento: number
): Array<{ competencia: string; dataVencimento: string }> {
  const inicio = new Date(`${dataInicio}T00:00:00`)
  const fim = new Date(`${dataFim}T00:00:00`)
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim < inicio) return []

  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1)
  const output: Array<{ competencia: string; dataVencimento: string }> = []

  while (cursor <= fim) {
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const dia = clampDiaParaMes(y, m, diaVencimento)
    const venc = new Date(y, m, dia)
    if (venc >= inicio && venc <= fim) {
      output.push({ competencia: toYm(venc), dataVencimento: toYmd(venc) })
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return output
}

export async function fetchFontesFinanceirasCliente(clienteId: string): Promise<FinanceiroFonteCliente[]> {
  const { data, error } = await supabase.rpc('get_financeiro_fontes_cliente', { p_cliente_id: clienteId })
  if (error) {
    console.error('Erro ao buscar fontes financeiras do cliente:', error)
    throw error
  }

  const rows = Array.isArray(data) ? data : []
  return rows.map((r: any) => ({
    cliente_plano_id: String(r.cliente_plano_id),
    plano_id: String(r.plano_id),
    plano_nome: String(r.plano_nome ?? ''),
    plano_valor: Number(r.plano_valor ?? 0),
    contrato_id: r.contrato_id ? String(r.contrato_id) : undefined,
    contrato_nome: r.contrato_nome ? String(r.contrato_nome) : undefined,
  }))
}

async function validarContratoAtivoCliente(clienteId: string, contratoId: string): Promise<void> {
  const { data, error } = await supabase
    .from('cliente_contratos')
    .select('id, status, contrato_assinado')
    .eq('id', contratoId)
    .eq('cliente_id', clienteId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    console.error('Erro ao validar contrato ativo:', error)
    throw error
  }
  if (!data) throw new Error('Contrato não encontrado para este cliente.')
  if (data.status !== 'ativo' || data.contrato_assinado === 'cancelado') {
    throw new Error('Somente contratos ativos podem ser vinculados à geração financeira.')
  }
}

async function validarPlanoFonteAtiva(
  clienteId: string,
  clientePlanoId: string,
  contratoId?: string
): Promise<void> {
  const fontes = await fetchFontesFinanceirasCliente(clienteId)
  const fonte = fontes.find((f) => f.cliente_plano_id === clientePlanoId)
  if (!fonte) {
    throw new Error('Plano selecionado não está ativo ou não é elegível para geração financeira.')
  }
  if (contratoId && fonte.contrato_id && contratoId !== fonte.contrato_id) {
    throw new Error('Contrato informado não corresponde ao vínculo ativo deste plano.')
  }
}

export async function gerarLancamentoClienteIndividual(input: GerarLancamentoIndividualInput): Promise<Transacao> {
  if (input.origem === 'plano' && !input.cliente_plano_id) {
    throw new Error('Selecione um plano ativo para gerar lançamento vinculado a plano.')
  }
  if (input.origem === 'plano' && input.cliente_plano_id) {
    await validarPlanoFonteAtiva(input.cliente_id, input.cliente_plano_id, input.contrato_id)
  }
  if (input.contrato_id) {
    await validarContratoAtivoCliente(input.cliente_id, input.contrato_id)
  }

  const metadata: Record<string, unknown> = {
    origem: 'manual_individual',
    origem_ref: input.origem,
  }
  if (input.cliente_plano_id) metadata.cliente_plano_id = input.cliente_plano_id
  if (input.contrato_id) metadata.contrato_id = input.contrato_id

  return createTransacao({
    cliente_id: input.cliente_id,
    tipo: 'receita',
    categoria: input.categoria,
    valor: input.valor,
    descricao: input.descricao,
    status: input.status,
    data_vencimento: input.data_vencimento,
    metadata,
  })
}

async function existeLancamentoLoteCompetencia(
  clienteId: string,
  categoria: string,
  competencia: string,
  origem: 'plano' | 'avulso',
  clientePlanoId?: string
): Promise<boolean> {
  let query = supabase
    .from('transacoes')
    .select('id', { head: true, count: 'exact' })
    .eq('cliente_id', clienteId)
    .eq('tipo', 'receita')
    .eq('categoria', categoria)
    .eq('metadata->>origem', 'geracao_lote')
    .eq('metadata->>mes_competencia', competencia)
    .is('deleted_at', null)

  if (origem === 'plano' && clientePlanoId) {
    query = query.eq('metadata->>cliente_plano_id', clientePlanoId)
  } else {
    query = query.eq('metadata->>origem_ref', 'avulso')
  }

  const { count, error } = await query
  if (error) {
    console.error('Erro ao verificar idempotência de lote:', error)
    throw error
  }
  return (count ?? 0) > 0
}

export async function gerarLancamentosClienteLote(input: GerarLancamentosLoteInput): Promise<GeracaoLoteResultado> {
  if (input.origem === 'plano' && !input.cliente_plano_id) {
    throw new Error('Selecione um plano ativo para geração em lote.')
  }
  if (input.origem === 'plano' && input.cliente_plano_id) {
    await validarPlanoFonteAtiva(input.cliente_id, input.cliente_plano_id, input.contrato_id)
  }
  if (input.contrato_id) {
    await validarContratoAtivoCliente(input.cliente_id, input.contrato_id)
  }

  const competencias = calcularCompetenciasMensais(input.data_inicio, input.data_fim, input.dia_vencimento)
  const resultado: GeracaoLoteResultado = {
    total_competencias: competencias.length,
    criados: 0,
    ignorados: 0,
    competencias: competencias.map((c) => c.competencia),
    transacoes_ids: [],
  }

  for (const item of competencias) {
    const existe = await existeLancamentoLoteCompetencia(
      input.cliente_id,
      input.categoria,
      item.competencia,
      input.origem,
      input.cliente_plano_id
    )
    if (existe) {
      resultado.ignorados += 1
      continue
    }

    const metadata: Record<string, unknown> = {
      origem: 'geracao_lote',
      origem_ref: input.origem,
      mes_competencia: item.competencia,
      dia_vencimento: input.dia_vencimento,
    }
    if (input.cliente_plano_id) metadata.cliente_plano_id = input.cliente_plano_id
    if (input.contrato_id) metadata.contrato_id = input.contrato_id

    const transacao = await createTransacao({
      cliente_id: input.cliente_id,
      tipo: 'receita',
      categoria: input.categoria,
      valor: input.valor,
      descricao: `${input.descricao_base} - ${item.competencia}`,
      status: input.status,
      data_vencimento: item.dataVencimento,
      metadata,
    })

    resultado.criados += 1
    resultado.transacoes_ids.push(transacao.id)
  }

  return resultado
}

/**
 * Conta lançamentos financeiros em aberto (pendente/vencido) vinculados a um contrato de plano ou serviço.
 */
export async function countTransacoesAbertoByContrato(
  contratoId: string,
  contratoTipo: 'plano' | 'servico'
): Promise<number> {
  const { count, error } = await supabase
    .from('transacoes')
    .select('*', { count: 'exact', head: true })
    .eq('metadata->>contrato_id', contratoId)
    .eq('metadata->>contrato_tipo', contratoTipo)
    .in('status', ['pendente', 'vencido'])
    .is('deleted_at', null)

  if (error) {
    console.error('Erro ao contar transações:', error)
    return 0
  }
  return count ?? 0
}

/**
 * Calcular quantas transações mensais serão geradas baseado no contrato
 */
export function calcularTransacoesMensais(
  dataInicio: string,
  dataFim: string | null,
  valorMensal: number
): {
  quantidade: number
  valorMensal: number
  transacoes: Array<{ data_vencimento: string; mes_competencia: string; valor: number }>
} {
  const toYMD = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const toYM = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

  const addMonthsPreserveDay = (base: Date, monthsToAdd: number) => {
    const day = base.getDate()
    const year = base.getFullYear()
    const month = base.getMonth()
    const target = new Date(year, month, 1)
    target.setMonth(target.getMonth() + monthsToAdd)
    // último dia do mês alvo
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
    target.setDate(Math.min(day, lastDay))
    return target
  }

  const inicio = new Date(`${dataInicio}T00:00:00`)
  const fim = dataFim ? new Date(`${dataFim}T23:59:59`) : null

  if (Number.isNaN(inicio.getTime())) {
    return { quantidade: 0, valorMensal: 0, transacoes: [] }
  }

  if (fim && (Number.isNaN(fim.getTime()) || fim < inicio)) {
    return { quantidade: 0, valorMensal: 0, transacoes: [] }
  }

  // Sem data fim => não dá pra gerar infinito; cria apenas a 1ª parcela com vencimento na data de início.
  if (!fim) {
    return {
      quantidade: 1,
      valorMensal: round2(valorMensal),
      transacoes: [
        {
          data_vencimento: toYMD(inicio),
          mes_competencia: toYM(inicio),
          valor: round2(valorMensal),
        },
      ],
    }
  }

  // Gera parcelas mensais (valor fixo mensal) a partir da data de início (mesmo dia),
  // até a data fim (inclusive). Se o dia não existir no mês, cai no último dia do mês.
  const datas: Date[] = []
  for (let i = 0; i < 240; i++) {
    const d = addMonthsPreserveDay(inicio, i)
    if (d > fim) break
    datas.push(d)
  }

  const quantidade = datas.length
  if (quantidade === 0) return { quantidade: 0, valorMensal: 0, transacoes: [] }

  const valorMensalFinal = round2(valorMensal)
  const transacoes = datas.map((d) => ({
    data_vencimento: toYMD(d),
    mes_competencia: toYM(d),
    valor: valorMensalFinal,
  }))

  return { quantidade, valorMensal: valorMensalFinal, transacoes }
}

/**
 * Gerar transações automáticas para um contrato de plano
 */
export async function gerarTransacoesContratoPlano(
  contrato: ClientePlano
): Promise<Transacao[]> {
  if (!contrato.data_inicio) {
    throw new Error('Contrato deve ter data de início para gerar transações')
  }

  const { transacoes } = calcularTransacoesMensais(
    contrato.data_inicio,
    contrato.data_fim || null,
    contrato.valor
  )

  const transacoesCriadas: Transacao[] = []

  for (const transacao of transacoes) {
    const dataVencimentoISO = transacao.data_vencimento
    const dataVencimento = new Date(`${dataVencimentoISO}T00:00:00`)

    // Status da transação baseado no status do contrato
    let status: 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado' = 'pendente'
    if (contrato.status === 'cancelado') {
      status = 'cancelado'
    } else if (contrato.status === 'finalizado') {
      // Se contrato finalizado, verificar se já passou a data
      status = dataVencimento < new Date() ? 'vencido' : 'pendente'
    } else if (contrato.status === 'pausado') {
      // Contratos pausados geram transações pendentes
      status = 'pendente'
    }

    try {
      const transacaoCriada = await createTransacao({
        cliente_id: contrato.cliente_id,
        tipo: 'receita',
        categoria: 'plano',
        valor: transacao.valor,
        descricao: `Contrato de plano${contrato.plano?.nome ? ` - ${contrato.plano.nome}` : ''}${contrato.observacoes ? ` - ${contrato.observacoes}` : ''}`,
        status,
        data_vencimento: dataVencimentoISO,
        metadata: {
          contrato_id: contrato.id,
          contrato_tipo: 'plano',
          plano_id: contrato.plano_id,
          mes_competencia: transacao.mes_competencia,
          origem: 'geracao_automatica',
        },
      })

      transacoesCriadas.push(transacaoCriada)
    } catch (error) {
      const err = error as any
      // Se houver índice único no banco, ignoramos duplicidades e seguimos.
      if (err?.code === '23505') {
        continue
      }
      console.error(`Erro ao criar transação para competência ${transacao.mes_competencia}:`, error)
      // Continua criando as outras transações mesmo se uma falhar
    }
  }

  return transacoesCriadas
}

/**
 * Gerar transações automáticas para um contrato de serviço avulso
 */
export async function gerarTransacoesContratoServico(
  contrato: ClienteServico
): Promise<Transacao[]> {
  if (!contrato.data_inicio) {
    throw new Error('Contrato deve ter data de início para gerar transações')
  }

  const { transacoes } = calcularTransacoesMensais(
    contrato.data_inicio,
    contrato.data_fim || null,
    contrato.valor
  )

  const transacoesCriadas: Transacao[] = []

  for (const transacao of transacoes) {
    const dataVencimentoISO = transacao.data_vencimento
    const dataVencimento = new Date(`${dataVencimentoISO}T00:00:00`)

    // Status da transação baseado no status do contrato
    let status: 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado' = 'pendente'
    if (contrato.status === 'cancelado') {
      status = 'cancelado'
    } else if (contrato.status === 'finalizado') {
      status = dataVencimento < new Date() ? 'vencido' : 'pendente'
    } else if (contrato.status === 'pausado') {
      status = 'pendente'
    }

    try {
      const transacaoCriada = await createTransacao({
        cliente_id: contrato.cliente_id,
        servico_id: contrato.servico_id,
        tipo: 'receita',
        categoria: 'servico_avulso',
        valor: transacao.valor,
        descricao: `Contrato de serviço avulso${contrato.servico?.nome ? ` - ${contrato.servico.nome}` : ''}${contrato.observacoes ? ` - ${contrato.observacoes}` : ''}`,
        status,
        data_vencimento: dataVencimentoISO,
        metadata: {
          contrato_id: contrato.id,
          contrato_tipo: 'servico',
          servico_id: contrato.servico_id,
          mes_competencia: transacao.mes_competencia,
          origem: 'geracao_automatica',
        },
      })

      transacoesCriadas.push(transacaoCriada)
    } catch (error) {
      const err = error as any
      if (err?.code === '23505') {
        continue
      }
      console.error(`Erro ao criar transação para competência ${transacao.mes_competencia}:`, error)
    }
  }

  return transacoesCriadas
}

/**
 * Atualizar transações futuras baseado no status do contrato
 */
export async function atualizarTransacoesFuturasContrato(
  contratoId: string,
  contratoTipo: 'plano' | 'servico',
  novoStatus: 'ativo' | 'pausado' | 'cancelado' | 'finalizado'
): Promise<void> {
  try {
    // Buscar transações relacionadas ao contrato que ainda não foram pagas
    const { data: transacoes, error } = await supabase
      .from('transacoes')
      .select('*')
      .eq('metadata->>contrato_id', contratoId)
      .eq('metadata->>contrato_tipo', contratoTipo)
      .in('status', ['pendente', 'vencido'])
      .is('deleted_at', null)

    if (error) {
      console.error('Erro ao buscar transações:', error)
      throw error
    }

    if (!transacoes || transacoes.length === 0) {
      return // Nenhuma transação para atualizar
    }

    // Atualizar status das transações baseado no novo status do contrato
    let novoStatusTransacao: 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado' = 'pendente'

    if (novoStatus === 'cancelado') {
      novoStatusTransacao = 'cancelado'
    } else if (novoStatus === 'finalizado') {
      // Verificar se já passou a data de vencimento
      const hoje = new Date()
      for (const transacao of transacoes) {
        const dataVencimento = new Date(transacao.data_vencimento)
        novoStatusTransacao = dataVencimento < hoje ? 'vencido' : 'pendente'

        await supabase
          .from('transacoes')
          .update({ status: novoStatusTransacao })
          .eq('id', transacao.id)
      }
      return
    } else if (novoStatus === 'pausado') {
      novoStatusTransacao = 'pendente' // Mantém pendente, mas pode ser pausado depois
    } else {
      novoStatusTransacao = 'pendente'
    }

    // Atualizar todas as transações de uma vez
    const ids = transacoes.map((t) => t.id)
    await supabase
      .from('transacoes')
      .update({ status: novoStatusTransacao })
      .in('id', ids)
  } catch (error) {
    console.error('Erro ao atualizar transações futuras:', error)
    throw error
  }
}

/**
 * Baixar título (marcar transação como paga)
 */
export async function baixarTitulo(
  transacaoId: string,
  dataPagamento: string,
  metodoPagamento?: string
): Promise<Transacao> {
  try {
    const { data, error } = await supabase
      .from('transacoes')
      .update({
        status: 'pago',
        data_pagamento: dataPagamento,
        metodo_pagamento: metodoPagamento || null,
      })
      .eq('id', transacaoId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Erro ao baixar título:', error)
      throw error
    }

    return {
      id: data.id,
      cliente_id: data.cliente_id,
      servico_id: data.servico_id || undefined,
      tipo: data.tipo,
      categoria: data.categoria,
      valor: Number(data.valor),
      moeda: data.moeda,
      descricao: data.descricao,
      metodo_pagamento: data.metodo_pagamento || undefined,
      status: data.status,
      data_vencimento: data.data_vencimento,
      data_pagamento: data.data_pagamento || undefined,
      external_transaction_id: data.external_transaction_id || undefined,
      external_source: data.external_source || undefined,
      metadata: data.metadata || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em baixarTitulo:', error)
    throw error
  }
}

/**
 * Calcular previsão de recebimento baseado em contratos e status
 */
export async function calcularPrevisaoRecebimento(
  clienteId: string
): Promise<{
  totalPrevisto: number
  totalPago: number
  totalPendente: number
  transacoesPendentes: Transacao[]
  transacoesPagas: Transacao[]
}> {
  try {
    // Buscar todas as transações do cliente
    const { data: transacoes, error } = await supabase
      .from('transacoes')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('tipo', 'receita')
      .is('deleted_at', null)
      .order('data_vencimento', { ascending: true })

    if (error) {
      console.error('Erro ao buscar transações:', error)
      throw error
    }

    const transacoesArray: Transacao[] = (transacoes || []).map((t: any) => ({
      id: t.id,
      cliente_id: t.cliente_id,
      servico_id: t.servico_id || undefined,
      tipo: t.tipo,
      categoria: t.categoria,
      valor: Number(t.valor),
      moeda: t.moeda,
      descricao: t.descricao,
      metodo_pagamento: t.metodo_pagamento || undefined,
      status: t.status,
      data_vencimento: t.data_vencimento,
      data_pagamento: t.data_pagamento || undefined,
      external_transaction_id: t.external_transaction_id || undefined,
      external_source: t.external_source || undefined,
      metadata: t.metadata || undefined,
      created_at: t.created_at,
      updated_at: t.updated_at,
      deleted_at: t.deleted_at || undefined,
    }))

    const transacoesPagas = transacoesArray.filter((t) => t.status === 'pago')
    const transacoesPendentes = transacoesArray.filter((t) =>
      ['pendente', 'vencido'].includes(t.status)
    )

    const totalPago = transacoesPagas.reduce((sum, t) => sum + t.valor, 0)
    const totalPendente = transacoesPendentes.reduce((sum, t) => sum + t.valor, 0)
    const totalPrevisto = totalPago + totalPendente

    return {
      totalPrevisto,
      totalPago,
      totalPendente,
      transacoesPendentes,
      transacoesPagas,
    }
  } catch (error) {
    console.error('Erro em calcularPrevisaoRecebimento:', error)
    throw error
  }
}

/**
 * Buscar uma transação por ID
 */
export async function fetchTransacaoById(id: string): Promise<Transacao | null> {
  try {
    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Erro ao buscar transação:', error)
      throw error
    }

    return {
      id: data.id,
      cliente_id: data.cliente_id,
      servico_id: data.servico_id || undefined,
      tipo: data.tipo,
      categoria: data.categoria,
      valor: Number(data.valor),
      moeda: data.moeda,
      descricao: data.descricao,
      metodo_pagamento: data.metodo_pagamento || undefined,
      status: data.status,
      data_vencimento: data.data_vencimento,
      data_pagamento: data.data_pagamento || undefined,
      external_transaction_id: data.external_transaction_id || undefined,
      external_source: data.external_source || undefined,
      metadata: data.metadata || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em fetchTransacaoById:', error)
    throw error
  }
}

/**
 * Buscar transações de um cliente
 */
export async function fetchTransacoesCliente(
  clienteId: string,
  filtros?: {
    tipo?: 'receita' | 'despesa'
    status?: 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado'
    dataInicio?: string
    dataFim?: string
  }
): Promise<Transacao[]> {
  try {
    let query = supabase
      .from('transacoes')
      .select('*')
      .eq('cliente_id', clienteId)
      .is('deleted_at', null)
      .order('data_vencimento', { ascending: true })

    if (filtros?.tipo) {
      query = query.eq('tipo', filtros.tipo)
    }

    if (filtros?.status) {
      query = query.eq('status', filtros.status)
    }

    if (filtros?.dataInicio) {
      query = query.gte('data_vencimento', filtros.dataInicio)
    }

    if (filtros?.dataFim) {
      query = query.lte('data_vencimento', filtros.dataFim)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar transações:', error)
      throw error
    }

    return (data || []).map((t: any) => ({
      id: t.id,
      cliente_id: t.cliente_id,
      servico_id: t.servico_id || undefined,
      tipo: t.tipo,
      categoria: t.categoria,
      valor: Number(t.valor),
      moeda: t.moeda,
      descricao: t.descricao,
      metodo_pagamento: t.metodo_pagamento || undefined,
      status: t.status,
      data_vencimento: t.data_vencimento,
      data_pagamento: t.data_pagamento || undefined,
      external_transaction_id: t.external_transaction_id || undefined,
      external_source: t.external_source || undefined,
      metadata: t.metadata || undefined,
      created_at: t.created_at,
      updated_at: t.updated_at,
      deleted_at: t.deleted_at || undefined,
    }))
  } catch (error) {
    console.error('Erro em fetchTransacoesCliente:', error)
    throw error
  }
}

/**
 * Buscar todas as transações (para página principal de financeiro)
 */
export async function fetchTransacoes(filtros?: {
  clienteId?: string
  tipo?: 'receita' | 'despesa'
  status?: 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado'
  dataInicio?: string
  dataFim?: string
  limit?: number
  offset?: number
}): Promise<{ transacoes: Transacao[]; total: number }> {
  try {
    let query = supabase
      .from('transacoes')
      .select('*', { count: 'exact', head: false })
      .is('deleted_at', null)
      .order('data_vencimento', { ascending: true })

    if (filtros?.clienteId) {
      query = query.eq('cliente_id', filtros.clienteId)
    }

    if (filtros?.tipo) {
      query = query.eq('tipo', filtros.tipo)
    }

    if (filtros?.status) {
      query = query.eq('status', filtros.status)
    }

    if (filtros?.dataInicio) {
      query = query.gte('data_vencimento', filtros.dataInicio)
    }

    if (filtros?.dataFim) {
      query = query.lte('data_vencimento', filtros.dataFim)
    }

    const limit = filtros?.limit || 50
    const offset = filtros?.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar transações:', error)
      throw error
    }

    const transacoes: Transacao[] = (data || []).map((t: any) => ({
      id: t.id,
      cliente_id: t.cliente_id,
      servico_id: t.servico_id || undefined,
      tipo: t.tipo,
      categoria: t.categoria,
      valor: Number(t.valor),
      moeda: t.moeda,
      descricao: t.descricao,
      metodo_pagamento: t.metodo_pagamento || undefined,
      status: t.status,
      data_vencimento: t.data_vencimento,
      data_pagamento: t.data_pagamento || undefined,
      external_transaction_id: t.external_transaction_id || undefined,
      external_source: t.external_source || undefined,
      metadata: t.metadata || undefined,
      created_at: t.created_at,
      updated_at: t.updated_at,
      deleted_at: t.deleted_at || undefined,
    }))

    return {
      transacoes,
      total: count || 0,
    }
  } catch (error) {
    console.error('Erro em fetchTransacoes:', error)
    throw error
  }
}

/**
 * Atualizar transação
 */
export async function updateTransacao(
  id: string,
  updates: {
    valor?: number
    descricao?: string
    status?: 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado'
    data_vencimento?: string
    data_pagamento?: string
    metodo_pagamento?: string
  }
): Promise<Transacao> {
  try {
    const updateData: any = {}

    if (updates.valor !== undefined) updateData.valor = updates.valor
    if (updates.descricao !== undefined) updateData.descricao = updates.descricao
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.data_vencimento !== undefined)
      updateData.data_vencimento = updates.data_vencimento
    if (updates.data_pagamento !== undefined)
      updateData.data_pagamento = updates.data_pagamento || null
    if (updates.metodo_pagamento !== undefined)
      updateData.metodo_pagamento = updates.metodo_pagamento || null

    const { data, error } = await supabase
      .from('transacoes')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar transação:', error)
      throw error
    }

    return {
      id: data.id,
      cliente_id: data.cliente_id,
      servico_id: data.servico_id || undefined,
      tipo: data.tipo,
      categoria: data.categoria,
      valor: Number(data.valor),
      moeda: data.moeda,
      descricao: data.descricao,
      metodo_pagamento: data.metodo_pagamento || undefined,
      status: data.status,
      data_vencimento: data.data_vencimento,
      data_pagamento: data.data_pagamento || undefined,
      external_transaction_id: data.external_transaction_id || undefined,
      external_source: data.external_source || undefined,
      metadata: data.metadata || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em updateTransacao:', error)
    throw error
  }
}

/**
 * Deletar transação (soft delete)
 */
export async function deleteTransacao(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('soft_delete_transacao', { transacao_id: id })

    if (error) {
      console.error('Erro ao deletar transação:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro em deleteTransacao:', error)
    throw error
  }
}
