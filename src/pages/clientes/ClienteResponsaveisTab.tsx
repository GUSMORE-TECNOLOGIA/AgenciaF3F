import { useState, useEffect } from 'react'
import { Plus, User, X } from 'lucide-react'
import { Cliente, ClienteResponsavel } from '@/types'
import { fetchClienteResponsaveis, softDeleteClienteResponsavel, createClienteResponsavel } from '@/services/cliente-responsaveis'
import { fetchUsuariosParaSelecaoResponsavel } from '@/services/usuarios'
import { useModal } from '@/contexts/ModalContext'

interface ClienteResponsaveisTabProps {
  cliente: Cliente
  refetch?: () => Promise<void>
}

export default function ClienteResponsaveisTab({ cliente, refetch }: ClienteResponsaveisTabProps) {
  const [responsaveis, setResponsaveis] = useState<ClienteResponsavel[]>([])
  const [responsaveisDisponiveis, setResponsaveisDisponiveis] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedResponsavelId, setSelectedResponsavelId] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['principal'])
  const [observacao, setObservacao] = useState('')
  const { confirm, alert: alertModal } = useModal()

  useEffect(() => {
    loadData()
  }, [cliente.id])

  async function loadData() {
    try {
      setLoading(true)
      const [responsaveisData, listaResponsaveis] = await Promise.all([
        fetchClienteResponsaveis(cliente.id),
        fetchUsuariosParaSelecaoResponsavel(),
      ])
      setResponsaveis(responsaveisData)
      setResponsaveisDisponiveis(listaResponsaveis || [])
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddResponsavel = async () => {
    if (!selectedResponsavelId || selectedRoles.length === 0) return

    try {
      await createClienteResponsavel({
        cliente_id: cliente.id,
        responsavel_id: selectedResponsavelId,
        roles: selectedRoles,
        observacao: observacao.trim() || undefined,
      })
      await loadData()
      await refetch?.()
      setShowAddModal(false)
      setSelectedResponsavelId('')
      setSelectedRoles(['principal'])
      setObservacao('')
    } catch (error) {
      console.error('Erro ao adicionar responsável:', error)
      const msg = error instanceof Error ? error.message : 'Erro ao adicionar responsável. Tente novamente ou verifique permissões.'
      await alertModal({ title: 'Erro ao adicionar responsável', message: msg, variant: 'danger' })
    }
  }

  const handleRemoveResponsavel = async (responsavelId: string) => {
    const ok = await confirm({
      title: 'Remover responsável',
      message: 'Deseja realmente remover este responsável?',
      confirmLabel: 'Remover',
      variant: 'danger',
    })
    if (!ok) return

    try {
      await softDeleteClienteResponsavel(responsavelId)
      await loadData()
      await refetch?.()
      await alertModal({ title: 'Removido', message: 'Responsável desvinculado do cliente.', variant: 'success' })
    } catch (error) {
      console.error('Erro ao remover responsável:', error)
      const msg = error instanceof Error ? error.message : 'Erro ao remover responsável. Verifique permissões.'
      await alertModal({ title: 'Erro ao remover responsável', message: msg, variant: 'danger' })
    }
  }

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role))
    } else {
      setSelectedRoles([...selectedRoles, role])
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      principal: 'Principal',
      comercial: 'Comercial',
      suporte: 'Suporte',
      backup: 'Backup',
    }
    return labels[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      principal: 'bg-blue-100 text-blue-800',
      comercial: 'bg-green-100 text-green-800',
      suporte: 'bg-yellow-100 text-yellow-800',
      backup: 'bg-muted text-foreground',
    }
    return colors[role] || 'bg-muted text-foreground'
  }

  const responsaveisPorPapel = {
    principal: responsaveis.filter((r) => r.roles.includes('principal')),
    comercial: responsaveis.filter((r) => r.roles.includes('comercial')),
    suporte: responsaveis.filter((r) => r.roles.includes('suporte')),
    backup: responsaveis.filter((r) => r.roles.includes('backup')),
  }

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Responsáveis</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os responsáveis atribuídos a {cliente.nome}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adicionar Responsável
        </button>
      </div>

      {/* Lista de Responsáveis por Papel */}
      <div className="space-y-4">
        {Object.entries(responsaveisPorPapel).map(([papel, responsaveisPapel]) => {
          if (responsaveisPapel.length === 0) return null

          return (
            <div key={papel} className="bg-card rounded-lg shadow-sm border border-border p-4">
              <h4 className="font-semibold text-foreground mb-3 capitalize">{papel}</h4>
              <div className="space-y-2">
                {responsaveisPapel.map((responsavel) => (
                  <div
                    key={responsavel.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {responsavel.responsavel?.name || 'Responsável'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {responsavel.responsavel?.email || '—'}
                        </p>
                        {responsavel.observacao && (
                          <p className="text-xs text-muted-foreground mt-1">{responsavel.observacao}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {responsavel.roles.map((role) => (
                          <span
                            key={role}
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(role)}`}
                          >
                            {getRoleLabel(role)}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleRemoveResponsavel(responsavel.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover responsável"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {responsaveis.length === 0 && (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum responsável atribuído ainda</p>
            <p className="text-sm text-muted-foreground mt-2">
              Use &quot;Adicionar Responsável&quot; para vincular responsáveis a este cliente.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Adicionar Responsável */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Adicionar Responsável
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Responsável
                </label>
                <select
                  value={selectedResponsavelId}
                  onChange={(e) => setSelectedResponsavelId(e.target.value)}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Selecione um responsável...</option>
                  {responsaveisDisponiveis
                    .filter((r) => !responsaveis.some((vr) => vr.responsavel_id === r.id))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name || r.email || r.id}
                      </option>
                    ))}
                </select>
                {responsaveisDisponiveis.length === 0 && (
                  <p className="text-amber-600 text-sm mt-1">
                    Nenhum responsável disponível para seleção. Verifique Configurações → Equipe e usuários.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Papéis
                </label>
                <div className="flex flex-wrap gap-2">
                  {['principal', 'comercial', 'suporte', 'backup'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedRoles.includes(role)
                          ? getRoleColor(role)
                          : 'bg-muted text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {getRoleLabel(role)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Observação (opcional)
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Observações sobre este responsável..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedResponsavelId('')
                  setSelectedRoles(['principal'])
                  setObservacao('')
                }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddResponsavel}
                disabled={!selectedResponsavelId || selectedRoles.length === 0}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
