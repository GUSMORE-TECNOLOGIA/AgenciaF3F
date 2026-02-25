import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, DollarSign, CheckCircle2, XCircle, AlertCircle, Clock, Loader2, Edit } from 'lucide-react'
import { useTransacoes, useDeleteTransacao, useBaixarTitulo } from '@/hooks/useFinanceiro'
import { Transacao } from '@/types'
import { useClientes } from '@/hooks/useClientes'
import { useModal } from '@/contexts/ModalContext'
import DateRangePicker, { type DateRange } from '@/components/DateRangePicker'
import { subDays, format, startOfDay } from 'date-fns'

const defaultRange = ((): DateRange => {
  const today = startOfDay(new Date())
  const from = subDays(today, 29)
  return { from: format(from, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') }
})()

export default function Financeiro() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado' | ''>('')
  const [clienteFilter, setClienteFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRange | null>(defaultRange)

  const dataInicio = dateRange?.from
  const dataFim = dateRange?.to

  const { transacoes, loading, refetch } = useTransacoes({
    tipo: 'receita',
    status: statusFilter || undefined,
    clienteId: clienteFilter || undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
  })

  const { clientes } = useClientes({ autoFetch: true, limit: 1000 })
  const { remove: deleteTransacao, loading: deleting } = useDeleteTransacao()
  const { baixar, loading: baixando } = useBaixarTitulo()
  const { confirm, alert, prompt } = useModal()

  const handleDelete = async (transacao: Transacao) => {
    const ok = await confirm({
      title: 'Excluir transação',
      message: `Deseja realmente excluir esta transação?\n\n${transacao.descricao}\n\nEsta ação é irreversível.`,
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

  const totalReceitas = transacoes.filter((t) => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0)
  const saldo = totalReceitas

  const totalAtrasados = transacoes.filter(isAtrasado).reduce((sum, t) => sum + t.valor, 0)

  const receitasPendentes = transacoes
    .filter((t) => t.tipo === 'receita' && ['pendente', 'vencido'].includes(t.status))
    .reduce((sum, t) => sum + t.valor, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground mt-1">Gestão de transações financeiras</p>
        </div>
        <Link
          to="/financeiro/nova"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Transação
        </Link>
      </div>

      {/* Filtro por período (layout profissional) */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <DateRangePicker
            value={dateRange}
            onChange={(r) => setDateRange(r)}
            placeholder="Selecionar período"
            className="min-w-0"
          />
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="vencido">Vencido</option>
            <option value="cancelado">Cancelado</option>
            <option value="reembolsado">Reembolsado</option>
          </select>
          <select
            value={clienteFilter}
            onChange={(e) => setClienteFilter(e.target.value)}
            className="px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Todos os clientes</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards de Resumo (do período) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Receita do período</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceitas)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Atrasados no período</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalAtrasados)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo do período</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(saldo)}
              </p>
            </div>
            <DollarSign className={`w-8 h-8 ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">A receber (período)</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(receitasPendentes)}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Lista de Transações */}
      {loading ? (
        <div className="bg-card rounded-lg shadow-sm border border-border p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando transações...</span>
          </div>
        </div>
      ) : transacoes.length === 0 ? (
        <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
          <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {transacoes
                  .filter((t) => !searchTerm || t.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((transacao) => (
                    <tr key={transacao.id} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{transacao.descricao}</div>
                        {transacao.categoria && (
                          <div className="text-sm text-muted-foreground mt-1">{transacao.categoria}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/clientes/${transacao.cliente_id}/editar`}
                          className="text-sm text-primary hover:underline"
                        >
                          {clientes.find((c) => c.id === transacao.cliente_id)?.nome || 'Cliente não encontrado'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                          {transacao.tipo === 'receita' ? '+' : '-'}
                          {formatCurrency(transacao.valor)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(transacao.data_vencimento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(transacao.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/financeiro/${transacao.id}/editar`}
                            className="text-primary hover:text-primary/80 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          {transacao.status === 'pendente' && transacao.tipo === 'receita' && (
                            <button
                              onClick={() => handleBaixarTitulo(transacao)}
                              disabled={baixando}
                              className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Baixar título"
                            >
                              {baixando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(transacao)}
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
        </div>
      )}
    </div>
  )
}
