import { useState, useEffect, useMemo } from 'react'
import { Plus, User, X } from 'lucide-react'
import { Cliente, ClienteResponsavel } from '@/types'
import { fetchClienteResponsaveis } from '@/services/mockData'
import { fetchEquipeMembros } from '@/services/equipe'
import { fetchUsuarioById } from '@/services/usuarios'
import { useModal } from '@/contexts/ModalContext'

const VIRTUAL_PRINCIPAL_PREFIX = 'virtual-principal-'

interface ClienteResponsaveisTabProps {
  cliente: Cliente
  /** Refetch do cliente ao abrir a aba (evita dados em cache após import). */
  refetch?: () => Promise<void>
}

export default function ClienteResponsaveisTab({ cliente, refetch }: ClienteResponsaveisTabProps) {
  const [responsaveis, setResponsaveis] = useState<ClienteResponsavel[]>([])
  const [membrosDisponiveis, setMembrosDisponiveis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [responsavelPrincipal, setResponsavelPrincipal] = useState<{ id: string; name: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMembroId, setSelectedMembroId] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['principal'])
  const [observacao, setObservacao] = useState('')
  const { confirm } = useModal()

  useEffect(() => {
    refetch?.()
  }, [])

  useEffect(() => {
    loadData()
  }, [cliente.id])

  useEffect(() => {
    if (!cliente.responsavel_id) {
      setResponsavelPrincipal(null)
      return
    }
    let cancelled = false
    fetchUsuarioById(cliente.responsavel_id)
      .then((u) => {
        if (!cancelled && u) setResponsavelPrincipal({ id: u.id, name: u.name })
        else if (!cancelled) setResponsavelPrincipal(null)
      })
      .catch(() => { if (!cancelled) setResponsavelPrincipal(null) })
    return () => { cancelled = true }
  }, [cliente.responsavel_id])

  async function loadData() {
    try {
      setLoading(true)
      const [responsaveisData, membrosData] = await Promise.all([
        fetchClienteResponsaveis(cliente.id),
        fetchEquipeMembros(),
      ])
      setResponsaveis(responsaveisData)
      setMembrosDisponiveis(membrosData)
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error)
    } finally {
      setLoading(false)
    }
  }

  /** Lista exibida: responsáveis da API + responsável principal (clientes.responsavel_id) se ainda não estiver na lista. */
  const displayResponsaveis = useMemo(() => {
    const list = [...responsaveis]
    const rid = (cliente.responsavel_id || '').trim()
    if (!rid) return list
    const jaIncluido = list.some((r) => r.responsavel_id === rid)
    if (jaIncluido) return list
    const name = cliente.responsavel?.name || responsavelPrincipal?.name || 'Responsável'
    const principal: ClienteResponsavel = {
      id: `${VIRTUAL_PRINCIPAL_PREFIX}${rid}`,
      cliente_id: cliente.id,
      responsavel_id: rid,
      roles: ['principal'],
      created_at: '',
      updated_at: '',
      responsavel: { id: rid, name, email: '' },
    }
    return [principal, ...list]
  }, [cliente.id, cliente.responsavel_id, cliente.responsavel?.name, responsavelPrincipal, responsaveis])

  const handleAddResponsavel = async () => {
    if (!selectedMembroId || selectedRoles.length === 0) return

    try {
      // TODO: Implementar chamada real ao Supabase
      console.log('Adicionar responsável:', {
        clienteId: cliente.id,
        responsavelId: selectedMembroId,
        roles: selectedRoles,
        observacao,
      })
      
      // Recarregar lista
      await loadData()
      setShowAddModal(false)
      setSelectedMembroId('')
      setSelectedRoles(['principal'])
      setObservacao('')
    } catch (error) {
      console.error('Erro ao adicionar responsável:', error)
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
      // TODO: Implementar chamada real ao Supabase
      console.log('Remover responsável:', responsavelId)
      await loadData()
    } catch (error) {
      console.error('Erro ao remover responsável:', error)
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
      backup: 'bg-gray-100 text-gray-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const responsaveisPorPapel = {
    principal: displayResponsaveis.filter((r) => r.roles.includes('principal')),
    comercial: displayResponsaveis.filter((r) => r.roles.includes('comercial')),
    suporte: displayResponsaveis.filter((r) => r.roles.includes('suporte')),
    backup: displayResponsaveis.filter((r) => r.roles.includes('backup')),
  }

  const isVirtualPrincipal = (r: ClienteResponsavel) =>
    typeof r.id === 'string' && r.id.startsWith(VIRTUAL_PRINCIPAL_PREFIX)

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Responsáveis</h3>
          <p className="text-sm text-gray-600 mt-1">
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
            <div key={papel} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="font-semibold text-foreground mb-3 capitalize">{papel}</h4>
              <div className="space-y-2">
                {responsaveisPapel.map((responsavel) => (
                  <div
                    key={responsavel.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {responsavel.responsavel?.name || 'Responsável'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {responsavel.responsavel?.email || '—'}
                        </p>
                        {responsavel.observacao && (
                          <p className="text-xs text-gray-500 mt-1">{responsavel.observacao}</p>
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
                      {!isVirtualPrincipal(responsavel) && (
                        <button
                          onClick={() => handleRemoveResponsavel(responsavel.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover responsável"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {displayResponsaveis.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum responsável atribuído ainda</p>
            <p className="text-sm text-gray-500 mt-2">
              O responsável principal pode ser definido na aba Identificação. Use &quot;Adicionar Responsável&quot; para outros papéis.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Adicionar Responsável */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Adicionar Responsável
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membro da Equipe
                </label>
                <select
                  value={selectedMembroId}
                  onChange={(e) => setSelectedMembroId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Selecione um membro...</option>
                  {membrosDisponiveis
                    .filter((m) => m.status === 'ativo')
                    .map((membro) => (
                      <option key={membro.id} value={membro.id}>
                        {membro.nome_completo} ({membro.perfil})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {getRoleLabel(role)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observação (opcional)
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Observações sobre este responsável..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedMembroId('')
                  setSelectedRoles(['principal'])
                  setObservacao('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddResponsavel}
                disabled={!selectedMembroId || selectedRoles.length === 0}
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
