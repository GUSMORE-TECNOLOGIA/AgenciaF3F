import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, Edit, Loader2, XCircle, AlertCircle } from 'lucide-react'
import { useBaixarTitulo, useDeleteTransacao, useTransacoesCliente } from '@/hooks/useFinanceiro'
import type { Transacao } from '@/types'

interface FinanceiroTabProps {
  clienteId: string
  clienteNome: string
}

export default function FinanceiroTab({ clienteId, clienteNome }: FinanceiroTabProps) {
  const { transacoes, loading, refetch } = useTransacoesCliente(clienteId, { tipo: 'receita' })
  const { remove: deleteTransacao, loading: deleting } = useDeleteTransacao()
  const { baixar, loading: baixando } = useBaixarTitulo()

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
  const totalAtrasados = transacoes.filter(isAtrasado).reduce((sum, t) => sum + t.valor, 0)
  const aReceber = transacoes
    .filter((t) => t.tipo === 'receita' && ['pendente', 'vencido'].includes(t.status))
    .reduce((sum, t) => sum + t.valor, 0)

  const handleDelete = async (transacao: Transacao) => {
    if (!confirm(`Deseja realmente excluir este lançamento?\n\n${transacao.descricao}\n\nEsta ação é irreversível.`)) {
      return
    }

    try {
      await deleteTransacao(transacao.id)
      await refetch()
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      alert('Erro ao excluir transação. Tente novamente.')
    }
  }

  const handleBaixarTitulo = async (transacao: Transacao) => {
    const dataPagamento = prompt('Data de pagamento (YYYY-MM-DD):', new Date().toISOString().split('T')[0])
    if (!dataPagamento) return

    const metodoPagamento = prompt('Método de pagamento (PIX, Cartão, Boleto, etc.):', 'PIX') || undefined

    try {
      await baixar(transacao.id, dataPagamento, metodoPagamento)
      await refetch()
      alert('Título baixado com sucesso!')
    } catch (error) {
      console.error('Erro ao baixar título:', error)
      alert('Erro ao baixar título. Tente novamente.')
    }
  }

  const getStatusBadge = (status: Transacao['status']) => {
    const badges = {
      pendente: { icon: Clock, className: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      pago: { icon: CheckCircle2, className: 'bg-green-100 text-green-800', label: 'Pago' },
      vencido: { icon: AlertCircle, className: 'bg-red-100 text-red-800', label: 'Vencido' },
      cancelado: { icon: XCircle, className: 'bg-gray-100 text-gray-800', label: 'Cancelado' },
      reembolsado: { icon: XCircle, className: 'bg-blue-100 text-blue-800', label: 'Reembolsado' },
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Receitas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceitas)}</p>
            </div>
            <span className="text-green-600 text-2xl">$</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Atrasados</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalAtrasados)}</p>
            </div>
            <span className="text-red-600 text-2xl">$</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">A Receber</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(aReceber)}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Lançamentos</h3>
            <p className="text-sm text-gray-600 mt-1">{clienteNome}</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-600">Carregando lançamentos...</span>
          </div>
        ) : transacoes.length === 0 ? (
          <div className="p-12 text-center text-gray-600">Nenhum lançamento encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transacoes.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{t.descricao}</div>
                      {t.categoria && <div className="text-sm text-gray-500 mt-1">{t.categoria}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">+{formatCurrency(t.valor)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(t.data_vencimento)}</td>
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

