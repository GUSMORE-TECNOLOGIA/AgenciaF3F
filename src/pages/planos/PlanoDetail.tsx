import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Package, Plus, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { usePlano } from '@/hooks/usePlanos'
import { useServicos } from '@/hooks/usePlanos'
import { useAddServicoToPlano, useRemoveServicoFromPlano } from '@/hooks/usePlanos'
import { useModal } from '@/contexts/ModalContext'

export default function PlanoDetail() {
  const { id } = useParams<{ id: string }>()
  const { plano, loading, refetch } = usePlano(id || null)
  const { servicos: servicosDisponiveis } = useServicos(true) // Apenas serviços ativos
  const { add: addServico, loading: adding } = useAddServicoToPlano()
  const { remove: removeServico, loading: removing } = useRemoveServicoFromPlano()
  const { confirm, alert } = useModal()

  const [selectedServicoId, setSelectedServicoId] = useState<string>('')

  const handleAddServico = async () => {
    if (!selectedServicoId || !plano) return

    // Verificar se o serviço já está no plano
    if (plano.servicos?.some((s) => s.id === selectedServicoId)) {
      await alert({
        title: 'Atenção',
        message: 'Este serviço já está vinculado ao plano',
        variant: 'warning',
      })
      return
    }

    try {
      await addServico({
        plano_id: plano.id,
        servico_id: selectedServicoId,
        ordem: (plano.servicos?.length || 0) + 1,
      })
      await refetch()
      setSelectedServicoId('')
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao adicionar serviço. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleRemoveServico = async (servicoId: string) => {
    if (!plano) return

    const ok = await confirm({
      title: 'Remover serviço',
      message: 'Deseja remover este serviço do plano?',
      confirmLabel: 'Remover',
      variant: 'danger',
    })
    if (!ok) return

    try {
      await removeServico(plano.id, servicoId)
      await refetch()
    } catch (error) {
      console.error('Erro ao remover serviço:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao remover serviço. Tente novamente.',
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

  // Serviços disponíveis que ainda não estão no plano
  const servicosNaoVinculados = servicosDisponiveis.filter(
    (s) => !plano?.servicos?.some((ps) => ps.id === s.id)
  )

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando dados do plano...</p>
      </div>
    )
  }

  if (!plano) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Plano não encontrado</p>
        <Link to="/planos" className="text-primary hover:underline">
          Voltar para lista de planos
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/planos"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para planos
      </Link>

      {/* Header do Plano */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{plano.nome}</h1>
              {plano.ativo ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            {plano.descricao && (
              <p className="text-muted-foreground mb-4">{plano.descricao}</p>
            )}
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-bold text-primary">{formatCurrency(plano.valor)}</div>
                <div className="text-sm text-muted-foreground">Valor fixo do plano</div>
              </div>
              {plano.servicos && plano.servicos.length > 0 && (
                <div>
                  <div className="text-2xl font-bold text-foreground">{plano.servicos.length}</div>
                  <div className="text-sm text-muted-foreground">
                    {plano.servicos.length === 1 ? 'serviço' : 'serviços'} vinculado
                    {plano.servicos.length === 1 ? '' : 's'}
                  </div>
                </div>
              )}
            </div>
          </div>
          <Link
            to={`/planos/${plano.id}/editar`}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Link>
        </div>
      </div>

      {/* Serviços Vinculados */}
      <div className="bg-card rounded-lg shadow-sm border border-border mb-6">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Serviços do Plano
          </h2>
        </div>

        <div className="p-6">
          {/* Adicionar Serviço */}
          {servicosNaoVinculados.length > 0 && (
            <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
              <label htmlFor="servico-select" className="block text-sm font-medium text-foreground mb-2">
                Adicionar Serviço ao Plano
              </label>
              <div className="flex gap-2">
                <select
                  id="servico-select"
                  value={selectedServicoId}
                  onChange={(e) => setSelectedServicoId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                  <option value="">Selecione um serviço...</option>
                  {servicosNaoVinculados.map((servico) => (
                    <option key={servico.id} value={servico.id}>
                      {servico.nome}
                      {servico.valor && ` - ${formatCurrency(servico.valor)}`}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddServico}
                  disabled={!selectedServicoId || adding}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Adicionar
                </button>
              </div>
            </div>
          )}

          {/* Lista de Serviços */}
          {!plano.servicos || plano.servicos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="mb-4">Nenhum serviço vinculado a este plano</p>
              {servicosNaoVinculados.length > 0 && (
                <p className="text-sm">Use o campo acima para adicionar serviços</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {plano.servicos.map((servico, index) => (
                <div
                  key={servico.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{servico.nome}</div>
                      {servico.descricao && (
                        <div className="text-sm text-muted-foreground mt-1">{servico.descricao}</div>
                      )}
                      {servico.valor && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Valor individual: {formatCurrency(servico.valor)}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveServico(servico.id)}
                    disabled={removing}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remover serviço"
                  >
                    {removing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
