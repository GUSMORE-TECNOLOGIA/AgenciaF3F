import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, MessageSquare, Loader2, Edit, Trash2 } from 'lucide-react'
import { useAtendimentos, useDeleteAtendimento } from '@/hooks/useAtendimentos'
import { Atendimento as AtendimentoType } from '@/types'
import { useClientes } from '@/hooks/useClientes'

export default function Atendimento() {
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'email' | 'whatsapp' | 'telefone' | 'presencial' | ''>('')
  const [clienteFilter, setClienteFilter] = useState<string>('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const { atendimentos, loading, refetch } = useAtendimentos({
    cliente_id: clienteFilter || undefined,
    tipo: tipoFilter || undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
  })

  const { clientes } = useClientes({ autoFetch: true, limit: 1000 })
  const { remove: deleteAtendimento, loading: deleting } = useDeleteAtendimento()

  const handleDelete = async (atendimento: AtendimentoType) => {
    if (!confirm(`Deseja realmente excluir este atendimento?\n\n${atendimento.assunto}\n\nEsta ação é irreversível.`)) {
      return
    }

    try {
      await deleteAtendimento(atendimento.id)
      await refetch()
    } catch (error) {
      console.error('Erro ao excluir atendimento:', error)
      alert('Erro ao excluir atendimento. Tente novamente.')
    }
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTipoBadge = (tipo: AtendimentoType['tipo']) => {
    const badges = {
      email: { className: 'bg-blue-100 text-blue-800', label: 'Email', icon: '📧' },
      whatsapp: { className: 'bg-green-100 text-green-800', label: 'WhatsApp', icon: '💬' },
      telefone: { className: 'bg-purple-100 text-purple-800', label: 'Telefone', icon: '📞' },
      presencial: { className: 'bg-orange-100 text-orange-800', label: 'Presencial', icon: '👤' },
    }

    const badge = badges[tipo]

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        <span>{badge.icon}</span>
        {badge.label}
      </span>
    )
  }

  const formatDuracao = (minutos?: number) => {
    if (!minutos) return '-'
    if (minutos < 60) return `${minutos} min`
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`
  }

  const filteredAtendimentos = atendimentos.filter((atendimento) => {
    if (searchTerm) {
      const cliente = clientes.find((c) => c.id === atendimento.cliente_id)
      const matchesSearch =
        atendimento.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        atendimento.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cliente && cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()))
      if (!matchesSearch) return false
    }
    return true
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atendimento</h1>
          <p className="text-gray-600 mt-1">Histórico de atendimentos aos clientes</p>
        </div>
        <Link
          to="/atendimento/novo"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Atendimento
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar atendimentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Todos os tipos</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="telefone">Telefone</option>
            <option value="presencial">Presencial</option>
          </select>
          <select
            value={clienteFilter}
            onChange={(e) => setClienteFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Todos os clientes</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              placeholder="Data Início"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              placeholder="Data Fim"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Lista de Atendimentos */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-600">Carregando atendimentos...</span>
          </div>
        </div>
      ) : filteredAtendimentos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {searchTerm || tipoFilter || clienteFilter || dataInicio || dataFim
              ? 'Nenhum atendimento encontrado com os filtros aplicados'
              : 'Nenhum atendimento cadastrado'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assunto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duração
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAtendimentos.map((atendimento) => {
                  const cliente = clientes.find((c) => c.id === atendimento.cliente_id)
                  return (
                    <tr key={atendimento.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/clientes/${atendimento.cliente_id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {cliente?.nome || 'Cliente não encontrado'}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">{atendimento.assunto}</div>
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">{atendimento.descricao}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getTipoBadge(atendimento.tipo)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(atendimento.data_atendimento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuracao(atendimento.duracao_minutos)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/atendimento/${atendimento.id}/editar`}
                            className="text-primary hover:text-primary/80 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(atendimento)}
                            disabled={deleting}
                            className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Excluir"
                          >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
