import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, Edit, Loader2, XCircle, AlertCircle, Plus, Layers3, Save } from 'lucide-react'
import {
  useBaixarTitulo,
  useDeleteTransacao,
  useTransacoesCliente,
  useFinanceiroFontesCliente,
  useGerarLancamentoFinanceiroIndividual,
  useGerarLancamentosFinanceiroLote,
} from '@/hooks/useFinanceiro'
import { useClienteContratos } from '@/hooks/usePlanos'
import type { Transacao } from '@/types'
import { useModal } from '@/contexts/ModalContext'
import { useAuth } from '@/contexts/AuthContext'
import { calcularCompetenciasMensais } from '@/services/financeiro'

interface FinanceiroTabProps {
  clienteId: string
  clienteNome: string
}

export default function FinanceiroTab({ clienteId, clienteNome }: FinanceiroTabProps) {
  const { pode } = useAuth()
  const podeEditar = pode('financeiro', 'editar')
  const { transacoes, loading, refetch } = useTransacoesCliente(clienteId)
  const { clienteContratos } = useClienteContratos(clienteId)
  const { fontes, loading: loadingFontes, refetch: refetchFontes } = useFinanceiroFontesCliente(clienteId)
  const { gerar: gerarIndividual, loading: generatingIndividual } = useGerarLancamentoFinanceiroIndividual()
  const { gerar: gerarLote, loading: generatingLote } = useGerarLancamentosFinanceiroLote()
  const { remove: deleteTransacao, loading: deleting } = useDeleteTransacao()
  const { baixar, loading: baixando } = useBaixarTitulo()
  const { confirm, alert, prompt } = useModal()
  const [modoCriacao, setModoCriacao] = useState<'none' | 'individual' | 'lote'>('none')
  const [origemIndividual, setOrigemIndividual] = useState<'plano' | 'avulso'>('plano')
  const [planoIndividual, setPlanoIndividual] = useState('')
  const [statusIndividual, setStatusIndividual] = useState<Transacao['status']>('pendente')
  const [contratoIndividual, setContratoIndividual] = useState('')
  const [valorIndividual, setValorIndividual] = useState<number>(0)
  const [descricaoIndividual, setDescricaoIndividual] = useState('')
  const [categoriaIndividual, setCategoriaIndividual] = useState('plano')
  const [vencimentoIndividual, setVencimentoIndividual] = useState(new Date().toISOString().slice(0, 10))

  const [origemLote, setOrigemLote] = useState<'plano' | 'avulso'>('plano')
  const [planoLote, setPlanoLote] = useState('')
  const [statusLote, setStatusLote] = useState<Transacao['status']>('pendente')
  const [contratoLote, setContratoLote] = useState('')
  const [valorLote, setValorLote] = useState<number>(0)
  const [descricaoLote, setDescricaoLote] = useState('')
  const [categoriaLote, setCategoriaLote] = useState('plano')
  const [dataInicioLote, setDataInicioLote] = useState(new Date().toISOString().slice(0, 10))
  const [dataFimLote, setDataFimLote] = useState(new Date().toISOString().slice(0, 10))
  const [diaVencimentoLote, setDiaVencimentoLote] = useState<number>(5)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const isAtrasado = (t: Transacao) => {
    if (t.tipo !== 'receita') return false
    if (!['pendente', 'vencido'].includes(t.status)) return false
    const hoje = new Date()
    const hojeYMD = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const venc = new Date(`${t.data_vencimento}T00:00:00`)
    return venc < hojeYMD
  }

  const totalReceitas = transacoes.filter((t) => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0)
  const totalDespesas = transacoes.filter((t) => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0)
  const saldo = totalReceitas - totalDespesas
  const totalAtrasados = transacoes.filter(isAtrasado).reduce((sum, t) => sum + t.valor, 0)
  const aReceber = transacoes
    .filter((t) => t.tipo === 'receita' && ['pendente', 'vencido'].includes(t.status))
    .reduce((sum, t) => sum + t.valor, 0)

  const fontesById = useMemo(() => {
    const map = new Map<string, (typeof fontes)[number]>()
    fontes.forEach((f) => map.set(f.cliente_plano_id, f))
    return map
  }, [fontes])
  const contratosAtivos = useMemo(
    () => clienteContratos.filter((c) => c.status === 'ativo' && c.contrato_assinado !== 'cancelado'),
    [clienteContratos]
  )

  const previewLote = useMemo(
    () => calcularCompetenciasMensais(dataInicioLote, dataFimLote, diaVencimentoLote),
    [dataInicioLote, dataFimLote, diaVencimentoLote]
  )

  const handleSubmitIndividual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (origemIndividual === 'plano' && !planoIndividual) {
      await alert({
        title: 'Plano obrigatório',
        message: 'Selecione um plano ativo do cliente para lançamento vinculado a plano.',
        variant: 'warning',
      })
      return
    }
    if (!descricaoIndividual.trim() || !categoriaIndividual.trim() || valorIndividual <= 0) {
      await alert({
        title: 'Campos obrigatórios',
        message: 'Preencha descrição, categoria e valor maior que zero.',
        variant: 'warning',
      })
      return
    }
    try {
      const fonte = planoIndividual ? fontesById.get(planoIndividual) : undefined
      await gerarIndividual({
        cliente_id: clienteId,
        origem: origemIndividual,
        cliente_plano_id: origemIndividual === 'plano' ? planoIndividual : undefined,
        contrato_id: contratoIndividual || fonte?.contrato_id,
        categoria: categoriaIndividual.trim(),
        descricao: descricaoIndividual.trim(),
        valor: valorIndividual,
        status: statusIndividual,
        data_vencimento: vencimentoIndividual,
      })
      await refetch()
      await alert({ title: 'Sucesso', message: 'Lançamento individual criado com sucesso.', variant: 'success' })
      setModoCriacao('none')
      setDescricaoIndividual('')
      setValorIndividual(0)
    } catch (error) {
      console.error('Erro ao gerar lançamento individual:', error)
      await alert({
        title: 'Erro',
        message: error instanceof Error ? error.message : 'Erro ao gerar lançamento individual.',
        variant: 'danger',
      })
    }
  }

  const handleSubmitLote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (origemLote === 'plano' && !planoLote) {
      await alert({
        title: 'Plano obrigatório',
        message: 'Selecione um plano ativo do cliente para geração em lote vinculada a plano.',
        variant: 'warning',
      })
      return
    }
    if (!descricaoLote.trim() || !categoriaLote.trim() || valorLote <= 0) {
      await alert({
        title: 'Campos obrigatórios',
        message: 'Preencha descrição base, categoria e valor maior que zero.',
        variant: 'warning',
      })
      return
    }
    if (previewLote.length === 0) {
      await alert({
        title: 'Período inválido',
        message: 'Não há competências válidas no período informado.',
        variant: 'warning',
      })
      return
    }

    const ok = await confirm({
      title: 'Confirmar geração em lote',
      message: `Serão processadas ${previewLote.length} competência(s). Deseja continuar?`,
      confirmLabel: 'Gerar lançamentos',
    })
    if (!ok) return

    try {
      const fonte = planoLote ? fontesById.get(planoLote) : undefined
      const result = await gerarLote({
        cliente_id: clienteId,
        origem: origemLote,
        cliente_plano_id: origemLote === 'plano' ? planoLote : undefined,
        contrato_id: contratoLote || fonte?.contrato_id,
        categoria: categoriaLote.trim(),
        descricao_base: descricaoLote.trim(),
        valor: valorLote,
        status: statusLote,
        data_inicio: dataInicioLote,
        data_fim: dataFimLote,
        dia_vencimento: diaVencimentoLote,
      })
      await refetch()
      await alert({
        title: 'Geração concluída',
        message: `Criados: ${result.criados} | Ignorados (já existentes): ${result.ignorados}`,
        variant: 'success',
      })
      setModoCriacao('none')
    } catch (error) {
      console.error('Erro ao gerar lote financeiro:', error)
      await alert({
        title: 'Erro',
        message: error instanceof Error ? error.message : 'Erro ao gerar lote financeiro.',
        variant: 'danger',
      })
    }
  }

  const handleDelete = async (transacao: Transacao) => {
    const ok = await confirm({
      title: 'Excluir lançamento',
      message: `Deseja realmente excluir este lançamento?\n\n${transacao.descricao}\n\nEsta ação é irreversível.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!ok) return

    try {
      await deleteTransacao(transacao.id)
      await refetch()
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao excluir transação. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleBaixarTitulo = async (transacao: Transacao) => {
    const dataPagamento = await prompt({
      title: 'Baixar título',
      message: 'Data de pagamento (YYYY-MM-DD):',
      inputType: 'date',
      defaultValue: new Date().toISOString().split('T')[0],
      confirmLabel: 'Confirmar',
    })
    if (!dataPagamento) return

    const metodoPagamento = await prompt({
      title: 'Baixar título',
      message: 'Método de pagamento (PIX, Cartão, Boleto, etc.):',
      defaultValue: 'PIX',
      placeholder: 'PIX',
      confirmLabel: 'Confirmar',
    })

    try {
      await baixar(transacao.id, dataPagamento, metodoPagamento || undefined)
      await refetch()
      await alert({
        title: 'Sucesso',
        message: 'Título baixado com sucesso!',
        variant: 'success',
      })
    } catch (error) {
      console.error('Erro ao baixar título:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao baixar título. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const getStatusBadge = (status: Transacao['status']) => {
    const badges = {
      pendente: { icon: Clock, className: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300', label: 'Pendente' },
      pago: { icon: CheckCircle2, className: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300', label: 'Pago' },
      vencido: { icon: AlertCircle, className: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300', label: 'Vencido' },
      cancelado: { icon: XCircle, className: 'bg-muted text-foreground', label: 'Cancelado' },
      reembolsado: { icon: XCircle, className: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300', label: 'Reembolsado' },
    }

    const badge = badges[status]
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Receitas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceitas)}</p>
            </div>
            <span className="text-green-600 text-2xl">$</span>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Atrasados</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalAtrasados)}</p>
            </div>
            <span className="text-red-600 text-2xl">$</span>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">A Receber</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(aReceber)}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(saldo)}
              </p>
            </div>
            <span className="text-2xl">{saldo >= 0 ? '+' : '-'}</span>
          </div>
        </div>
      </div>

      {/* Ações premium */}
      {podeEditar && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setModoCriacao((s) => (s === 'individual' ? 'none' : 'individual'))
                if (fontes.length === 0) refetchFontes()
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Lançamento individual
            </button>
            <button
              type="button"
              onClick={() => {
                setModoCriacao((s) => (s === 'lote' ? 'none' : 'lote'))
                if (fontes.length === 0) refetchFontes()
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted"
            >
              <Layers3 className="w-4 h-4" />
              Gerar em lote
            </button>
            {loadingFontes && <span className="text-sm text-muted-foreground">Carregando planos ativos...</span>}
          </div>

          {modoCriacao === 'individual' && (
            <form onSubmit={handleSubmitIndividual} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1 text-foreground">Origem</label>
                <select
                  value={origemIndividual}
                  onChange={(e) => setOrigemIndividual(e.target.value as 'plano' | 'avulso')}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="plano">Plano ativo</option>
                  <option value="avulso">Avulso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Plano ativo (quando origem plano)</label>
                <select
                  value={planoIndividual}
                  onChange={(e) => {
                    const value = e.target.value
                    setPlanoIndividual(value)
                    if (value) {
                      const fonte = fontesById.get(value)
                      if (fonte?.contrato_id) setContratoIndividual(fonte.contrato_id)
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  disabled={origemIndividual === 'avulso'}
                >
                  <option value="">Selecione...</option>
                  {fontes.map((f) => (
                    <option key={f.cliente_plano_id} value={f.cliente_plano_id}>
                      {f.plano_nome}
                      {f.contrato_nome ? ` • ${f.contrato_nome}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Contrato ativo (opcional)</label>
                <select
                  value={contratoIndividual}
                  onChange={(e) => setContratoIndividual(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="">Sem vínculo</option>
                  {contratosAtivos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome || 'Contrato sem nome'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Categoria</label>
                <input
                  value={categoriaIndividual}
                  onChange={(e) => setCategoriaIndividual(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={valorIndividual}
                  onChange={(e) => setValorIndividual(Number(e.target.value || 0))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Data de vencimento</label>
                <input
                  type="date"
                  value={vencimentoIndividual}
                  onChange={(e) => setVencimentoIndividual(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Status</label>
                <select
                  value={statusIndividual}
                  onChange={(e) => setStatusIndividual(e.target.value as Transacao['status'])}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="vencido">Vencido</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="reembolsado">Reembolsado</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1 text-foreground">Descrição</label>
                <input
                  value={descricaoIndividual}
                  onChange={(e) => setDescricaoIndividual(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="Ex.: Parcela manual de ajuste"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={generatingIndividual}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60"
                >
                  {generatingIndividual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar lançamento
                </button>
              </div>
            </form>
          )}

          {modoCriacao === 'lote' && (
            <form onSubmit={handleSubmitLote} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1 text-foreground">Origem</label>
                <select
                  value={origemLote}
                  onChange={(e) => setOrigemLote(e.target.value as 'plano' | 'avulso')}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="plano">Plano ativo</option>
                  <option value="avulso">Avulso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Plano ativo (quando origem plano)</label>
                <select
                  value={planoLote}
                  onChange={(e) => {
                    const value = e.target.value
                    setPlanoLote(value)
                    if (value) {
                      const fonte = fontesById.get(value)
                      if (fonte?.contrato_id) setContratoLote(fonte.contrato_id)
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  disabled={origemLote === 'avulso'}
                >
                  <option value="">Selecione...</option>
                  {fontes.map((f) => (
                    <option key={f.cliente_plano_id} value={f.cliente_plano_id}>
                      {f.plano_nome}
                      {f.contrato_nome ? ` • ${f.contrato_nome}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Contrato ativo (opcional)</label>
                <select
                  value={contratoLote}
                  onChange={(e) => setContratoLote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="">Sem vínculo</option>
                  {contratosAtivos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome || 'Contrato sem nome'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Data inicial</label>
                <input
                  type="date"
                  value={dataInicioLote}
                  onChange={(e) => setDataInicioLote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Data final</label>
                <input
                  type="date"
                  value={dataFimLote}
                  onChange={(e) => setDataFimLote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Dia de vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={diaVencimentoLote}
                  onChange={(e) => setDiaVencimentoLote(Number(e.target.value || 1))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Status</label>
                <select
                  value={statusLote}
                  onChange={(e) => setStatusLote(e.target.value as Transacao['status'])}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="vencido">Vencido</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="reembolsado">Reembolsado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Categoria</label>
                <input
                  value={categoriaLote}
                  onChange={(e) => setCategoriaLote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">Valor mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={valorLote}
                  onChange={(e) => setValorLote(Number(e.target.value || 0))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1 text-foreground">Descrição base</label>
                <input
                  value={descricaoLote}
                  onChange={(e) => setDescricaoLote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="Ex.: Mensalidade"
                />
              </div>
              <div className="md:col-span-2 p-3 rounded-lg border border-border bg-muted/40 text-sm">
                Prévia de competências: <strong>{previewLote.length}</strong>
                {previewLote.length > 0 && (
                  <span className="text-muted-foreground"> • {previewLote.map((x) => x.competencia).join(', ')}</span>
                )}
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={generatingLote}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60"
                >
                  {generatingLote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers3 className="w-4 h-4" />}
                  Gerar em lote
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Lista */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Lançamentos</h3>
            <p className="text-sm text-muted-foreground mt-1">{clienteNome}</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando lançamentos...</span>
          </div>
        ) : transacoes.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Nenhum lançamento encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Vencimento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {transacoes.map((t) => (
                  <tr key={t.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{t.descricao}</div>
                      {t.categoria && <div className="text-sm text-muted-foreground mt-1">{t.categoria}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {t.tipo === 'receita' ? 'Receita' : 'Despesa'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${t.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.tipo === 'receita' ? '+' : '-'}
                        {formatCurrency(t.valor)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{formatDate(t.data_vencimento)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(t.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/financeiro/${t.id}/editar`}
                          className="text-primary hover:text-primary/80 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {t.status === 'pendente' && (
                          <button
                            onClick={() => handleBaixarTitulo(t)}
                            disabled={baixando}
                            className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Baixar título"
                          >
                            {baixando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(t)}
                          disabled={deleting}
                          className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Excluir"
                        >
                          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

