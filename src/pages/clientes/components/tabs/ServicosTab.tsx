import { useState } from 'react'
import { Cliente } from '@/types'
import {
  useClientePlanos,
  useClienteServicos,
  useCreateClientePlano,
  useCreateClienteServico,
  useDeleteClientePlano,
  useDeleteClienteServico,
  usePlanos,
  useServicos,
} from '@/hooks/usePlanos'
import { Plus, Package, Briefcase, Loader2, Edit, CheckCircle2, XCircle, Pause, Clock, Trash2 } from 'lucide-react'
import { ClientePlano, ClienteServico } from '@/types'
import EditClientePlanoModal from './modals/EditClientePlanoModal'
import EditClienteServicoModal from './modals/EditClienteServicoModal'
import HistoricoStatusModal from './HistoricoStatusModal'
import { gerarTransacoesContratoPlano, gerarTransacoesContratoServico } from '@/services/financeiro'
import { useModal } from '@/contexts/ModalContext'

interface ServicosTabProps {
  cliente: Cliente
  onSave?: () => void
}

export default function ServicosTab({ cliente, onSave }: ServicosTabProps) {
  const { clientePlanos, loading: loadingPlanos, refetch: refetchPlanos } = useClientePlanos(cliente.id)
  const { clienteServicos, loading: loadingServicos, refetch: refetchServicos } = useClienteServicos(cliente.id)
  const { planos } = usePlanos(true) // Apenas planos ativos
  const { servicos } = useServicos(true) // Apenas serviços ativos
  const { create: createClientePlano, loading: creatingPlano } = useCreateClientePlano()
  const { create: createClienteServico, loading: creatingServico } = useCreateClienteServico()
  const { remove: deleteClientePlano, loading: deletingPlano } = useDeleteClientePlano()
  const { remove: deleteClienteServico, loading: deletingServico } = useDeleteClienteServico()
  const { confirm, alert } = useModal()

  const [showAddPlano, setShowAddPlano] = useState(false)
  const [showAddServico, setShowAddServico] = useState(false)
  const [selectedPlanoId, setSelectedPlanoId] = useState<string>('')
  const [selectedServicoId, setSelectedServicoId] = useState<string>('')
  const [valorPlano, setValorPlano] = useState<string>('')
  const [valorServico, setValorServico] = useState<string>('')
  const [dataInicioPlano, setDataInicioPlano] = useState<string>('')
  const [dataFimPlano, setDataFimPlano] = useState<string>('')
  const [dataInicioServico, setDataInicioServico] = useState<string>('')
  const [dataFimServico, setDataFimServico] = useState<string>('')
  const [editingPlano, setEditingPlano] = useState<ClientePlano | null>(null)
  const [editingServico, setEditingServico] = useState<ClienteServico | null>(null)
  const [historicoPlano, setHistoricoPlano] = useState<ClientePlano | null>(null)
  const [historicoServico, setHistoricoServico] = useState<ClienteServico | null>(null)

  const handleAddPlano = async () => {
    if (!selectedPlanoId || !valorPlano || !dataInicioPlano) {
      await alert({
        title: 'Campos obrigatórios',
        message: 'Preencha todos os campos obrigatórios: plano, valor e data de início',
        variant: 'warning',
      })
      return
    }

    const planoSelecionado = planos.find((p) => p.id === selectedPlanoId)
    if (!planoSelecionado) return

    try {
      const contrato = await createClientePlano({
        cliente_id: cliente.id,
        plano_id: selectedPlanoId,
        valor: Number(valorPlano),
        moeda: 'BRL',
        status: 'ativo',
        data_inicio: dataInicioPlano,
        data_fim: dataFimPlano || undefined,
      })

      // Gerar parcelas automaticamente baseado nas datas
      try {
        await gerarTransacoesContratoPlano({
          ...contrato,
          plano: planoSelecionado,
        })
      } catch (transacaoError) {
        console.error('Erro ao gerar parcelas:', transacaoError)
        await alert({
          title: 'Atenção',
          message: 'Contrato criado, mas houve erro ao gerar parcelas. Verifique o console.',
          variant: 'warning',
        })
      }

      await refetchPlanos()
      if (onSave) onSave()
      setShowAddPlano(false)
      setSelectedPlanoId('')
      setValorPlano('')
      setDataInicioPlano('')
      setDataFimPlano('')
    } catch (error) {
      console.error('Erro ao adicionar plano:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao adicionar plano. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleAddServico = async () => {
    if (!selectedServicoId || !valorServico || !dataInicioServico) {
      await alert({
        title: 'Campos obrigatórios',
        message: 'Preencha todos os campos obrigatórios: serviço, valor e data de início',
        variant: 'warning',
      })
      return
    }

    const servicoSelecionado = servicos.find((s) => s.id === selectedServicoId)
    if (!servicoSelecionado) return

    try {
      const contrato = await createClienteServico({
        cliente_id: cliente.id,
        servico_id: selectedServicoId,
        valor: Number(valorServico),
        moeda: 'BRL',
        status: 'ativo',
        data_inicio: dataInicioServico,
        data_fim: dataFimServico || undefined,
      })

      // Gerar parcelas automaticamente baseado nas datas
      try {
        await gerarTransacoesContratoServico({
          ...contrato,
          servico: servicoSelecionado,
        })
      } catch (transacaoError) {
        console.error('Erro ao gerar parcelas:', transacaoError)
        await alert({
          title: 'Atenção',
          message: 'Contrato criado, mas houve erro ao gerar parcelas. Verifique o console.',
          variant: 'warning',
        })
      }

      await refetchServicos()
      if (onSave) onSave()
      setShowAddServico(false)
      setSelectedServicoId('')
      setValorServico('')
      setDataInicioServico('')
      setDataFimServico('')
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao adicionar serviço. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleDeletePlanoContrato = async (contrato: ClientePlano) => {
    const ok = await confirm({
      title: 'Excluir contrato',
      message: `Deseja realmente excluir este plano contratado?\n\n${contrato.plano?.nome || 'Plano'}\n\nEsta ação é irreversível.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!ok) return

    try {
      await deleteClientePlano(contrato.id)
      await refetchPlanos()
      if (onSave) onSave()
    } catch (error) {
      console.error('Erro ao excluir contrato de plano:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao excluir contrato de plano. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleDeleteServicoContrato = async (contrato: ClienteServico) => {
    const ok = await confirm({
      title: 'Excluir contrato',
      message: `Deseja realmente excluir este serviço contratado?\n\n${contrato.servico?.nome || 'Serviço'}\n\nEsta ação é irreversível.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!ok) return

    try {
      await deleteClienteServico(contrato.id)
      await refetchServicos()
      if (onSave) onSave()
    } catch (error) {
      console.error('Erro ao excluir contrato de serviço:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao excluir contrato de serviço. Tente novamente.',
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ativo: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
      pausado: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Pause },
      cancelado: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      finalizado: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle2 },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ativo
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    )
  }

  const loading = loadingPlanos || loadingServicos

  return (
    <div className="space-y-6">
      {/* Planos Contratados */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Planos Contratados
          </h2>
          <button
            onClick={() => setShowAddPlano(!showAddPlano)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Plano
          </button>
        </div>

        <div className="p-6">
          {/* Formulário de Adicionar Plano */}
          {showAddPlano && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Plano
                  </label>
                  <select
                    value={selectedPlanoId}
                    onChange={(e) => {
                      setSelectedPlanoId(e.target.value)
                      const plano = planos.find((p) => p.id === e.target.value)
                      if (plano) {
                        setValorPlano(plano.valor.toString())
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="">Selecione um plano...</option>
                    {planos.map((plano) => (
                      <option key={plano.id} value={plano.id}>
                        {plano.nome} - {formatCurrency(plano.valor)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor do Contrato (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorPlano}
                    onChange={(e) => setValorPlano(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      value={dataInicioPlano}
                      onChange={(e) => setDataInicioPlano(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Fim (opcional)
                    </label>
                    <input
                      type="date"
                      value={dataFimPlano}
                      onChange={(e) => setDataFimPlano(e.target.value)}
                      min={dataInicioPlano}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddPlano}
                    disabled={!selectedPlanoId || !valorPlano || !dataInicioPlano || creatingPlano}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingPlano && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPlano(false)
                      setSelectedPlanoId('')
                      setValorPlano('')
                      setDataInicioPlano('')
                      setDataFimPlano('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Planos */}
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-gray-500">Carregando planos...</p>
            </div>
          ) : clientePlanos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p>Nenhum plano contratado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientePlanos.map((contrato) => (
                <div
                  key={contrato.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-medium text-foreground">
                        {contrato.plano?.nome || 'Plano não encontrado'}
                      </div>
                      {getStatusBadge(contrato.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Valor: {formatCurrency(contrato.valor)}
                      {contrato.plano && contrato.valor !== contrato.plano.valor && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Plano: {formatCurrency(contrato.plano.valor)})
                        </span>
                      )}
                    </div>
                    {contrato.observacoes && (
                      <div className="text-sm text-gray-500 mt-1">{contrato.observacoes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHistoricoPlano(contrato)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Ver histórico"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingPlano(contrato)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlanoContrato(contrato)}
                      disabled={deletingPlano}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Excluir contrato"
                    >
                      {deletingPlano ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Serviços Avulsos Contratados */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Serviços Avulsos
          </h2>
          <button
            onClick={() => setShowAddServico(!showAddServico)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Serviço
          </button>
        </div>

        <div className="p-6">
          {/* Formulário de Adicionar Serviço */}
          {showAddServico && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Serviço
                  </label>
                  <select
                    value={selectedServicoId}
                    onChange={(e) => {
                      setSelectedServicoId(e.target.value)
                      const servico = servicos.find((s) => s.id === e.target.value)
                      if (servico && servico.valor) {
                        setValorServico(servico.valor.toString())
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="">Selecione um serviço...</option>
                    {servicos.map((servico) => (
                      <option key={servico.id} value={servico.id}>
                        {servico.nome}
                        {servico.valor && ` - ${formatCurrency(servico.valor)}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor do Contrato (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorServico}
                    onChange={(e) => setValorServico(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      value={dataInicioServico}
                      onChange={(e) => setDataInicioServico(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Fim (opcional)
                    </label>
                    <input
                      type="date"
                      value={dataFimServico}
                      onChange={(e) => setDataFimServico(e.target.value)}
                      min={dataInicioServico}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddServico}
                    disabled={!selectedServicoId || !valorServico || !dataInicioServico || creatingServico}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingServico && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddServico(false)
                      setSelectedServicoId('')
                      setValorServico('')
                      setDataInicioServico('')
                      setDataFimServico('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Serviços */}
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-gray-500">Carregando serviços...</p>
            </div>
          ) : clienteServicos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p>Nenhum serviço avulso contratado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clienteServicos.map((contrato) => (
                <div
                  key={contrato.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-medium text-foreground">
                        {contrato.servico?.nome || 'Serviço não encontrado'}
                      </div>
                      {getStatusBadge(contrato.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Valor: {formatCurrency(contrato.valor)}
                      {contrato.servico?.valor && contrato.valor !== contrato.servico.valor && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Serviço: {formatCurrency(contrato.servico.valor)})
                        </span>
                      )}
                    </div>
                    {contrato.observacoes && (
                      <div className="text-sm text-gray-500 mt-1">{contrato.observacoes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHistoricoServico(contrato)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Ver histórico"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingServico(contrato)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteServicoContrato(contrato)}
                      disabled={deletingServico}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Excluir contrato"
                    >
                      {deletingServico ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modais de Edição */}
      {editingPlano && (
        <EditClientePlanoModal
          contrato={editingPlano}
          isOpen={!!editingPlano}
          onClose={() => setEditingPlano(null)}
          onSuccess={async () => {
            await refetchPlanos()
            if (onSave) onSave()
          }}
        />
      )}

      {editingServico && (
        <EditClienteServicoModal
          contrato={editingServico}
          isOpen={!!editingServico}
          onClose={() => setEditingServico(null)}
          onSuccess={async () => {
            await refetchServicos()
            if (onSave) onSave()
          }}
        />
      )}

      {/* Modais de Histórico */}
      {historicoPlano && (
        <HistoricoStatusModal
          tipoContrato="plano"
          contratoId={historicoPlano.id}
          contratoNome={historicoPlano.plano?.nome || 'Plano'}
          isOpen={!!historicoPlano}
          onClose={() => setHistoricoPlano(null)}
        />
      )}

      {historicoServico && (
        <HistoricoStatusModal
          tipoContrato="servico"
          contratoId={historicoServico.id}
          contratoNome={historicoServico.servico?.nome || 'Serviço'}
          isOpen={!!historicoServico}
          onClose={() => setHistoricoServico(null)}
        />
      )}
    </div>
  )
}
