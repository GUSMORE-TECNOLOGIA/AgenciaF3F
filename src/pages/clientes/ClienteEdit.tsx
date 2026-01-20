import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Briefcase, DollarSign, AlertCircle, MessageSquare, Link as LinkIcon, Trash2 } from 'lucide-react'
import { useCliente, useDeleteCliente } from '@/hooks/useCliente'
import { useModal } from '@/contexts/ModalContext'
import IdentificacaoTab from './components/tabs/IdentificacaoTab'
import LinksUteisTab from './components/tabs/LinksUteisTab'
import ClienteResponsaveisTab from './ClienteResponsaveisTab'
import ServicosTab from './components/tabs/ServicosTab'

export default function ClienteEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { cliente, loading: loadingCliente, refetch } = useCliente(id || null)
  const { remove: deleteCliente, loading: deleting } = useDeleteCliente(id || '')
  const { confirm, alert } = useModal()

  const [activeTab, setActiveTab] = useState<
    'identificacao' | 'links' | 'responsaveis' | 'servicos' | 'financeiro' | 'ocorrencias' | 'atendimento'
  >('identificacao')

  const tabs = [
    { id: 'identificacao', label: 'Identificação', icon: Briefcase },
    { id: 'links', label: 'Links Úteis', icon: LinkIcon },
    { id: 'responsaveis', label: 'Responsáveis', icon: User },
    { id: 'servicos', label: 'Serviços', icon: Briefcase },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
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
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao excluir cliente. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  if (loadingCliente) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Carregando dados do cliente...</p>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Cliente não encontrado</p>
        <Link to="/clientes" className="text-primary hover:underline">
          Voltar para lista de clientes
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px]">
      {/* Breadcrumb e botões */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/clientes"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar para lista</span>
        </Link>
        <button
          onClick={handleDeleteCliente}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Excluir Cliente
        </button>
      </div>

      {/* Tabs compactas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
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
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
            <ClienteResponsaveisTab clienteId={cliente.id} clienteNome={cliente.nome} />
          )}

          {activeTab === 'servicos' && (
            <ServicosTab cliente={cliente} onSave={refetch} />
          )}

          {activeTab === 'financeiro' && (
            <div className="text-center py-12 text-gray-500">
              Módulo Financeiro em desenvolvimento
            </div>
          )}

          {activeTab === 'ocorrencias' && (
            <div className="text-center py-12 text-gray-500">
              Módulo de Ocorrências em desenvolvimento
            </div>
          )}

          {activeTab === 'atendimento' && (
            <div className="text-center py-12 text-gray-500">
              Módulo de Atendimento em desenvolvimento
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
