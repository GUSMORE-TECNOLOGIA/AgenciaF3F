import { useState } from 'react'
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft, User, Briefcase, DollarSign, AlertCircle, MessageSquare, Link as LinkIcon, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCliente, useDeleteCliente } from '@/hooks/useCliente'
import { useModal } from '@/contexts/ModalContext'
import IdentificacaoTab from './components/tabs/IdentificacaoTab'
import LinksUteisTab from './components/tabs/LinksUteisTab'
import ClienteResponsaveisTab from './ClienteResponsaveisTab'
import ServicosTab from './components/tabs/ServicosTab'

export default function ClienteEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, pode } = useAuth()
  const { cliente, loading: loadingCliente, error: errorCliente, refetch } = useCliente(id || null)
  const { remove: deleteCliente, loading: deleting } = useDeleteCliente(id || '')
  const { confirm, alert } = useModal()

  const [activeTab, setActiveTab] = useState<
    'identificacao' | 'links' | 'responsaveis' | 'servicos' | 'financeiro' | 'ocorrencias' | 'atendimento'
  >('identificacao')

  const podeFinanceiro = pode('financeiro', 'visualizar')
  const tabs = [
    { id: 'identificacao', label: 'Identificação', icon: Briefcase },
    { id: 'links', label: 'Links Úteis', icon: LinkIcon },
    { id: 'responsaveis', label: 'Responsáveis', icon: User },
    { id: 'servicos', label: 'Serviços', icon: Briefcase },
    ...(podeFinanceiro ? [{ id: 'financeiro' as const, label: 'Financeiro', icon: DollarSign }] : []),
    { id: 'ocorrencias', label: 'Ocorrências', icon: AlertCircle },
    { id: 'atendimento', label: 'Atendimento', icon: MessageSquare },
  ]

  const handleDeleteCliente = async () => {
    if (!cliente) return
    const ok = await confirm({
      title: 'Excluir cliente',
      message: `Deseja realmente excluir o cliente "${cliente.nome}"?\n\nEsta ação é irreversível.`,
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

  if (loadingCliente) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Carregando dados do cliente...</p>
      </div>
    )
  }

  if (errorCliente) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-2">Erro ao carregar cliente</p>
        <p className="text-muted-foreground text-sm mb-4">{errorCliente.message}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <Link
            to="/clientes"
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
          >
            Voltar para lista
          </Link>
        </div>
      </div>
    )
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

  return (
    <div className="max-w-[1200px]">
      {/* Breadcrumb e botões */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/clientes"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar para lista</span>
        </Link>
        <button
          onClick={handleDeleteCliente}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Excluir Cliente
        </button>
      </div>

      {/* Tabs compactas */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="border-b border-border">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 h-9 text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <Icon className="w-4 h-4" />
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
            <div className="text-center py-12 text-muted-foreground">
              Módulo Financeiro em desenvolvimento
            </div>
          )}

          {activeTab === 'ocorrencias' && (
            <div className="text-center py-12 text-muted-foreground">
              Módulo de Ocorrências em desenvolvimento
            </div>
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
