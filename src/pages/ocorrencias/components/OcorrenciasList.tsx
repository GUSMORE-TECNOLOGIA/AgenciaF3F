import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, AlertCircle, Loader2, Edit, Trash2 } from 'lucide-react'
import { useOcorrencias, useDeleteOcorrencia, useOcorrenciaGrupos, useOcorrenciaTipos } from '@/hooks/useOcorrencias'
import { Ocorrencia } from '@/types'
import { useClientes } from '@/hooks/useClientes'
import { useModal } from '@/contexts/ModalContext'

export default function OcorrenciasList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'aberta' | 'em_andamento' | 'resolvida' | 'cancelada' | ''>('')
  const [prioridadeFilter, setPrioridadeFilter] = useState<'baixa' | 'media' | 'alta' | 'urgente' | ''>('')
  const [clienteFilter, setClienteFilter] = useState<string>('')
  const [grupoFilter, setGrupoFilter] = useState<string>('')
  const [tipoFilter, setTipoFilter] = useState<string>('')
  const [reminderFilter, setReminderFilter] = useState<'pendente' | 'feito' | 'cancelado' | ''>('')

  const filtros = useMemo(
    () => ({
      cliente_id: clienteFilter || undefined,
      status: statusFilter || undefined,
      prioridade: prioridadeFilter || undefined,
      grupo_id: grupoFilter || undefined,
      tipo_id: tipoFilter || undefined,
      reminder_status: reminderFilter || undefined,
    }),
    [clienteFilter, statusFilter, prioridadeFilter, grupoFilter, tipoFilter, reminderFilter]
  )

  const { ocorrencias, loading, refetch } = useOcorrencias(filtros)

  const { clientes } = useClientes({ autoFetch: true, limit: 1000 })
  const { grupos } = useOcorrenciaGrupos()
  const { tipos } = useOcorrenciaTipos({ grupoId: grupoFilter || undefined })
  const { remove: deleteOcorrencia, loading: deleting } = useDeleteOcorrencia()
  const { confirm, alert } = useModal()

  const handleDelete = async (ocorrencia: Ocorrencia) => {
    const ok = await confirm({
      title: 'Excluir ocorrência',
      message: 'Deseja realmente excluir esta ocorrência?\n\nEsta ação é irreversível.',
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!ok) return

    try {
      await deleteOcorrencia(ocorrencia.id)
      await refetch()
    } catch (error) {
      console.error('Erro ao excluir ocorrência:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao excluir ocorrência. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  const getStatusBadge = (status: Ocorrencia['status']) => {
    const badges = {
      aberta: { className: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300', label: 'Aberta' },
      em_andamento: { className: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300', label: 'Em Andamento' },
      resolvida: { className: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300', label: 'Resolvida' },
      cancelada: { className: 'bg-muted text-foreground', label: 'Cancelada' },
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
      baixa: { className: 'bg-muted text-foreground', label: 'Baixa' },
      media: { className: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300', label: 'Média' },
      alta: { className: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300', label: 'Alta' },
      urgente: { className: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300', label: 'Urgente' },
    }

    const badge = badges[prioridade]

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const getReminderBadge = (status?: Ocorrencia['reminder_status']) => {
    if (!status) {
      return <span className="text-xs text-muted-foreground">—</span>
    }
    const badges = {
      pendente: { className: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300', label: 'Pendente' },
      feito: { className: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300', label: 'Feito' },
      cancelado: { className: 'bg-muted text-foreground', label: 'Cancelado' },
    }

    const badge = badges[status]

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const grupoMap = useMemo(() => {
    return new Map(grupos.map((grupo) => [grupo.id, grupo.nome]))
  }, [grupos])

  const tipoMap = useMemo(() => {
    return new Map(tipos.map((tipo) => [tipo.id, tipo.nome]))
  }, [tipos])

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ocorrências</h1>
          <p className="text-muted-foreground mt-1">Gestão de ocorrências e tickets</p>
        </div>
        <Link
          to="/ocorrencias/nova"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Ocorrência
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar ocorrências..."
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
            <option value="aberta">Aberta</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="resolvida">Resolvida</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <select
            value={prioridadeFilter}
            onChange={(e) => setPrioridadeFilter(e.target.value as any)}
            className="px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
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
            className="px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Todos os clientes</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
          <select
            value={grupoFilter}
            onChange={(e) => {
              setGrupoFilter(e.target.value)
              setTipoFilter('')
            }}
            className="px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Todos os grupos</option>
            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nome}
              </option>
            ))}
          </select>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            disabled={!grupoFilter}
          >
            <option value="">{grupoFilter ? 'Todos os tipos' : 'Selecione um grupo'}</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </select>
          <select
            value={reminderFilter}
            onChange={(e) => setReminderFilter(e.target.value as any)}
            className="px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Todos os lembretes</option>
            <option value="pendente">Pendente</option>
            <option value="feito">Feito</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-card rounded-lg shadow-sm border border-border p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando ocorrências...</span>
          </div>
        </div>
      ) : filteredOcorrencias.length === 0 ? (
        <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            {searchTerm || statusFilter || prioridadeFilter || clienteFilter || grupoFilter || tipoFilter || reminderFilter
              ? 'Nenhuma ocorrência encontrada com os filtros aplicados'
              : 'Nenhuma ocorrência cadastrada'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Grupo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Lembrete
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredOcorrencias.map((ocorrencia) => {
                  const cliente = clientes.find((c) => c.id === ocorrencia.cliente_id)
                  return (
                    <tr key={ocorrencia.id} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/clientes/${ocorrencia.cliente_id}/editar`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {cliente?.nome || 'Cliente não encontrado'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {grupoMap.get(ocorrencia.grupo_id) || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {tipoMap.get(ocorrencia.tipo_id) || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(ocorrencia.ocorreu_em)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getPrioridadeBadge(ocorrencia.prioridade)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(ocorrencia.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {ocorrencia.reminder_at ? formatDateTime(ocorrencia.reminder_at) : '—'}
                          </div>
                          {getReminderBadge(ocorrencia.reminder_status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/ocorrencias/${ocorrencia.id}/editar`}
                            className="text-primary hover:text-primary/80"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(ocorrencia)}
                            disabled={deleting}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
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
