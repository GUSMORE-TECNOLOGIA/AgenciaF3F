import { useState } from 'react'
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft, User, Briefcase, DollarSign, AlertCircle, MessageSquare, Edit, Link as LinkIcon, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCliente, useUpdateClienteStatus, useDeleteCliente } from '@/hooks/useCliente'
import { useModal } from '@/contexts/ModalContext'
import ClienteResponsaveisTab from './ClienteResponsaveisTab'
import IdentificacaoTab from './components/tabs/IdentificacaoTab'
import LinksUteisTab from './components/tabs/LinksUteisTab'
import ServicosTab from './components/tabs/ServicosTab'
import FinanceiroTab from './components/tabs/FinanceiroTab'
import OcorrenciasTab from './components/tabs/OcorrenciasTab'

export default function ClienteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, pode } = useAuth()
  const { cliente, loading, refetch } = useCliente(id || null)
  const { update: updateStatus } = useUpdateClienteStatus(id || '')
  const { remove: deleteCliente, loading: deleting } = useDeleteCliente(id || '')
  const { confirm, alert } = useModal()
  const podeFinanceiro = pode('financeiro', 'visualizar')

  const [activeTab, setActiveTab] = useState<
    'identificacao' | 'links' | 'responsaveis' | 'servicos' | 'financeiro' | 'ocorrencias' | 'atendimento'
  >('identificacao')

  const handleStatusChange = async (newStatus: 'ativo' | 'inativo' | 'pausado') => {
    const ok = await confirm({
      title: 'Confirmar alteração',
      message: `Deseja alterar o status do cliente para \"${newStatus}\"?`,
    })
    if (!ok) return

    try {
      await updateStatus(newStatus)
      await refetch()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao atualizar status. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleDeleteCliente = async () => {
    if (!cliente) return
    const ok = await confirm({
      title: 'Excluir cliente',
      message: 'Deseja realmente excluir este cliente?\n\nEsta ação é irreversível.',
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!ok) return

    try {
      await deleteCliente()
      navigate('/clientes')
    } catch (err) {
      console.error('Erro ao excluir cliente:', err)
      const msg = err instanceof Error ? err.message : 'Erro ao excluir cliente. Tente novamente.'
      await alert({
        title: 'Erro ao excluir cliente',
        message: msg,
        variant: 'danger',
      })
    }
  }

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Cliente não encontrado</p>
        <Link to="/clientes" className="text-primary hover:underline">
          Voltar para lista de clientes
        </Link>
      </div>
    )
  }

  const isAgenteOperacional = user?.perfil === 'agente' && user?.role !== 'admin'
  if (isAgenteOperacional && cliente.responsavel_id !== user?.id) {
    return <Navigate to="/clientes" replace />
  }

  const tabs = [
    { id: 'identificacao', label: 'Identificação', icon: Briefcase },
    { id: 'links', label: 'Links Úteis', icon: LinkIcon },
    { id: 'responsaveis', label: 'Responsáveis', icon: User },
    { id: 'servicos', label: 'Serviços', icon: Briefcase },
    ...(podeFinanceiro ? [{ id: 'financeiro' as const, label: 'Financeiro', icon: DollarSign }] : []),
    { id: 'ocorrencias', label: 'Ocorrências', icon: AlertCircle },
    { id: 'atendimento', label: 'Atendimento', icon: MessageSquare },
  ]

  return (
    <div>
      <Link
        to="/clientes"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </Link>

      {/* Header do Cliente */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Logo */}
          {cliente.logo_url ? (
            <img
              src={cliente.logo_url}
              alt={`Logo de ${cliente.nome}`}
              className="w-20 h-20 object-contain border border-border rounded-lg bg-card p-2 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted flex-shrink-0">
              <Briefcase className="w-8 h-8 text-muted-foreground" />
            </div>
          )}

          {/* Informações */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{cliente.nome}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  {cliente.email && <span>{cliente.email}</span>}
                  {cliente.telefone && <span>{cliente.telefone}</span>}
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      cliente.status === 'ativo'
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                        : cliente.status === 'pausado'
                        ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {cliente.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/clientes/${cliente.id}/editar`}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Link>
                <button
                  onClick={handleDeleteCliente}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
                {cliente.status === 'ativo' && (
                  <button
                    onClick={() => handleStatusChange('inativo')}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Inativar
                  </button>
                )}
                {cliente.status === 'inativo' && (
                  <button
                    onClick={() => handleStatusChange('ativo')}
                    className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
                  >
                    Ativar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-lg shadow-sm border border-border mb-6">
        <div className="border-b border-border">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
              {activeTab === 'identificacao' && (
                <IdentificacaoTab cliente={cliente} onSave={refetch} />
              )}

              {activeTab === 'links' && (
                <LinksUteisTab cliente={cliente} onSave={refetch} />
              )}

          {activeTab === 'responsaveis' && (
            <ClienteResponsaveisTab cliente={cliente} refetch={refetch} />
          )}

          {activeTab === 'servicos' && (
            <ServicosTab cliente={cliente} onSave={refetch} />
          )}

          {podeFinanceiro && activeTab === 'financeiro' && (
            <FinanceiroTab clienteId={cliente.id} clienteNome={cliente.nome} />
          )}

          {activeTab === 'ocorrencias' && (
            <OcorrenciasTab clienteId={cliente.id} clienteNome={cliente.nome} />
          )}

          {activeTab === 'atendimento' && (
            <div className="text-center py-12 text-muted-foreground">
              Módulo de Atendimento em desenvolvimento
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
