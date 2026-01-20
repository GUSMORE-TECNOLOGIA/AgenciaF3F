import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, AlertCircle, Filter, Loader2, Edit, Trash2 } from 'lucide-react'
import { useOcorrencias, useDeleteOcorrencia } from '@/hooks/useOcorrencias'
import { Ocorrencia } from '@/types'
import { useClientes } from '@/hooks/useClientes'

export default function Ocorrencias() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'aberta' | 'em_andamento' | 'resolvida' | 'cancelada' | ''>('')
  const [prioridadeFilter, setPrioridadeFilter] = useState<'baixa' | 'media' | 'alta' | 'urgente' | ''>('')
  const [clienteFilter, setClienteFilter] = useState<string>('')

  const { ocorrencias, loading, refetch } = useOcorrencias({
    cliente_id: clienteFilter || undefined,
    status: statusFilter || undefined,
    prioridade: prioridadeFilter || undefined,
  })

  const { clientes } = useClientes({ autoFetch: true, limit: 1000 })
  const { remove: deleteOcorrencia, loading: deleting } = useDeleteOcorrencia()

  const handleDelete = async (ocorrencia: Ocorrencia) => {
    if (!confirm(`Deseja realmente excluir esta ocorrência?\n\nEsta ação é irreversível.`)) {
      return
    }

    try {
      await deleteOcorrencia(ocorrencia.id)
      await refetch()
    } catch (error) {
      console.error('Erro ao excluir ocorrência:', error)
      alert('Erro ao excluir ocorrência. Tente novamente.')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: Ocorrencia['status']) => {
    const badges = {
      aberta: { className: 'bg-blue-100 text-blue-800', label: 'Aberta' },
      em_andamento: { className: 'bg-yellow-100 text-yellow-800', label: 'Em Andamento' },
      resolvida: { className: 'bg-green-100 text-green-800', label: 'Resolvida' },
      cancelada: { className: 'bg-gray-100 text-gray-800', label: 'Cancelada' },
    }

    const badge = badges[status]

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const getPrioridadeBadge = (prioridade: Ocorrencia['prioridade']) => {
    const badges = {
      baixa: { className: 'bg-gray-100 text-gray-800', label: 'Baixa' },
      media: { className: 'bg-blue-100 text-blue-800', label: 'Média' },
      alta: { className: 'bg-orange-100 text-orange-800', label: 'Alta' },
      urgente: { className: 'bg-red-100 text-red-800', label: 'Urgente' },
    }

    const badge = badges[prioridade]

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const filteredOcorrencias = ocorrencias.filter((ocorrencia) => {
    if (searchTerm) {
      const cliente = clientes.find((c) => c.id === ocorrencia.cliente_id)
      const matchesSearch =
        ocorrencia.notas.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <h1 className="text-3xl font-bold text-foreground">Ocorrências</h1>
          <p className="text-gray-600 mt-1">Gestão de ocorrências e tickets</p>
        </div>
        <Link
          to="/ocorrencias/nova"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Ocorrência
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar ocorrências..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Todos os status</option>
            <option value="aberta">Aberta</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="resolvida">Resolvida</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <select
            value={prioridadeFilter}
            onChange={(e) => setPrioridadeFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Todas as prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
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
        </div>
      </div>

      {/* Lista de Ocorrências */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-600">Carregando ocorrências...</span>
          </div>
        </div>
      ) : filteredOcorrencias.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {searchTerm || statusFilter || prioridadeFilter || clienteFilter
              ? 'Nenhuma ocorrência encontrada com os filtros aplicados'
              : 'Nenhuma ocorrência cadastrada'}
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
                    Notas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOcorrencias.map((ocorrencia) => {
                  const cliente = clientes.find((c) => c.id === ocorrencia.cliente_id)
                  return (
                    <tr key={ocorrencia.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/clientes/${ocorrencia.cliente_id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {cliente?.nome || 'Cliente não encontrado'}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground">{ocorrencia.notas}</div>
                        {ocorrencia.is_sensitive && (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Sensível
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ocorrencia.ocorreu_em)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getPrioridadeBadge(ocorrencia.prioridade)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(ocorrencia.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/ocorrencias/${ocorrencia.id}/editar`}
                            className="text-primary hover:text-primary/80 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(ocorrencia)}
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
