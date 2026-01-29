import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Briefcase, DollarSign, AlertCircle, MessageSquare, Edit, Link as LinkIcon, Trash2 } from 'lucide-react'
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
  const { cliente, loading, refetch } = useCliente(id || null)
  const { update: updateStatus } = useUpdateClienteStatus(id || '')
  const { remove: deleteCliente, loading: deleting } = useDeleteCliente(id || '')
  const { confirm, alert } = useModal()
  
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
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao excluir cliente. Tente novamente.',
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
        <p className="text-gray-500 mb-4">Cliente não encontrado</p>
        <Link to="/clientes" className="text-primary hover:underline">
          Voltar para lista de clientes
        </Link>
      </div>
    )
  }

  const tabs = [
    { id: 'identificacao', label: 'Identificação', icon: Briefcase },
    { id: 'links', label: 'Links Úteis', icon: LinkIcon },
    { id: 'responsaveis', label: 'Responsáveis', icon: User },
    { id: 'servicos', label: 'Serviços', icon: Briefcase },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'ocorrencias', label: 'Ocorrências', icon: AlertCircle },
    { id: 'atendimento', label: 'Atendimento', icon: MessageSquare },
  ]

  return (
    <div>
      <Link
        to="/clientes"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </Link>

      {/* Header do Cliente */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Logo */}
          {cliente.logo_url ? (
            <img
              src={cliente.logo_url}
              alt={`Logo de ${cliente.nome}`}
              className="w-20 h-20 object-contain border border-gray-200 rounded-lg bg-white p-2 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
          )}

          {/* Informações */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{cliente.nome}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  {cliente.email && <span>{cliente.email}</span>}
                  {cliente.telefone && <span>{cliente.telefone}</span>}
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      cliente.status === 'ativo'
                        ? 'bg-green-100 text-green-800'
                        : cliente.status === 'pausado'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {cliente.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/clientes/${cliente.id}/editar`}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Link>
                <button
                  onClick={handleDeleteCliente}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
                {cliente.status === 'ativo' && (
                  <button
                    onClick={() => handleStatusChange('inativo')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Inativar
                  </button>
                )}
                {cliente.status === 'inativo' && (
                  <button
                    onClick={() => handleStatusChange('ativo')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
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
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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

          {activeTab === 'financeiro' && (
            <FinanceiroTab clienteId={cliente.id} clienteNome={cliente.nome} />
          )}

          {activeTab === 'ocorrencias' && (
            <OcorrenciasTab clienteId={cliente.id} clienteNome={cliente.nome} />
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
