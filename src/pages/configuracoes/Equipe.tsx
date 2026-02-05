import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Users, Shield, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { EquipeMembro, Perfil } from '@/types'
import {
  createEquipeMembro,
  deleteEquipeMembro,
  fetchEquipeMembros,
  updateEquipeMembro,
  type EquipeMembroInput,
} from '@/services/equipe'
import {
  createPerfil,
  deletePerfil,
  fetchPerfis,
  fetchPermissoesByPerfil,
  savePermissoes,
  updatePerfil,
} from '@/services/perfis'
import { createTeamUser } from '@/services/createTeamUser'
import { updateUsuarioPerfil } from '@/services/usuarios'
import EquipeMembroForm from './components/EquipeMembroForm'
import EquipeMembrosTable from './components/EquipeMembrosTable'
import PerfilPermissoesForm, { type PerfilFormInput } from './components/PerfilPermissoesForm'
import { useModal } from '@/contexts/ModalContext'

type TabType = 'membros' | 'perfis'

export default function Equipe() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('membros')
  const [membros, setMembros] = useState<EquipeMembro[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingMembro, setEditingMembro] = useState<EquipeMembro | null>(null)
  const { confirm, alert } = useModal()

  // Aba Perfis
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [perfisLoading, setPerfisLoading] = useState(false)
  const [perfisSaving, setPerfisSaving] = useState(false)
  const [showPerfilForm, setShowPerfilForm] = useState(false)
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null)
  const [permissoesPerfil, setPermissoesPerfil] = useState<Awaited<ReturnType<typeof fetchPermissoesByPerfil>>>([])

  useEffect(() => {
    loadMembros()
    loadPerfis()
  }, [])

  useEffect(() => {
    if (activeTab === 'perfis') loadPerfis()
  }, [activeTab])

  async function loadPerfis() {
    try {
      setPerfisLoading(true)
      const data = await fetchPerfis()
      setPerfis(data)
    } catch (error) {
      console.error('Erro ao carregar perfis:', error)
    } finally {
      setPerfisLoading(false)
    }
  }

  async function loadMembros() {
    try {
      setLoading(true)
      const data = await fetchEquipeMembros()
      setMembros(data)
    } catch (error) {
      console.error('Erro ao carregar membros:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembros = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return membros
    return membros.filter((membro) =>
      membro.nome_completo.toLowerCase().includes(term) ||
      (membro.email || '').toLowerCase().includes(term)
    )
  }, [membros, searchTerm])

  const handleSubmit = async (data: EquipeMembroInput) => {
    if (!user) {
      await alert({
        title: 'Sessão expirada',
        message: 'Usuário não autenticado. Faça login novamente.',
        variant: 'warning',
      })
      return
    }

    try {
      setSaving(true)
      if (editingMembro) {
        await updateEquipeMembro(editingMembro.id, data)
        if (editingMembro.user_id && data.perfil_id) {
          await updateUsuarioPerfil(editingMembro.user_id, data.perfil_id)
        }
      } else {
        const email = (data.email ?? '').trim()
        if (!email) {
          await alert({
            title: 'Email obrigatório',
            message: 'Informe o email para criar o acesso do membro (senha padrão 123456).',
            variant: 'warning',
          })
          return
        }
        const { id: userId } = await createTeamUser({
          email,
          name: data.nome_completo,
          perfil: data.perfil,
          perfil_id: data.perfil_id ?? undefined,
        })
        await createEquipeMembro({ ...data, user_id: userId }, user.id)
      }
      setShowForm(false)
      setEditingMembro(null)
      await loadMembros()
    } catch (err: unknown) {
      console.error('Erro ao salvar membro:', err)
      const msg = err instanceof Error ? err.message : 'Erro ao salvar membro. Tente novamente.'
      await alert({ title: 'Erro', message: msg, variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (membro: EquipeMembro) => {
    const ok = await confirm({
      title: 'Excluir membro',
      message: 'Deseja realmente excluir este membro da equipe?\n\nEsta ação é irreversível.',
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!ok) return

    try {
      setDeletingId(membro.id)
      await deleteEquipeMembro(membro.id)
      await loadMembros()
    } catch (error) {
      console.error('Erro ao excluir membro:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao excluir membro. Tente novamente.',
        variant: 'danger',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handlePerfilSubmit = async (data: PerfilFormInput) => {
    try {
      setPerfisSaving(true)
      if (editingPerfil) {
        await updatePerfil(editingPerfil.id, { nome: data.nome, descricao: data.descricao })
        await savePermissoes(
          editingPerfil.id,
          data.permissoes.map((p) => ({ ...p, perfil_id: editingPerfil.id }))
        )
      } else {
        const novo = await createPerfil({ nome: data.nome, descricao: data.descricao })
        await savePermissoes(
          novo.id,
          data.permissoes.map((p) => ({ ...p, perfil_id: novo.id }))
        )
      }
      setShowPerfilForm(false)
      setEditingPerfil(null)
      setPermissoesPerfil([])
      await loadPerfis()
    } catch (err: unknown) {
      console.error('Erro ao salvar perfil:', err)
      const msg = err instanceof Error ? err.message : 'Erro ao salvar perfil. Tente novamente.'
      await alert({ title: 'Erro', message: msg, variant: 'danger' })
    } finally {
      setPerfisSaving(false)
    }
  }

  const handleEditPerfil = async (perfil: Perfil) => {
    const perms = await fetchPermissoesByPerfil(perfil.id)
    setPermissoesPerfil(perms)
    setEditingPerfil(perfil)
    setShowPerfilForm(true)
  }

  const handleDeletePerfil = async (perfil: Perfil) => {
    if (perfil.slug) {
      await alert({
        title: 'Perfil padrão',
        message: 'Perfis padrão (Administrador, Gerente, Agente, Suporte) não podem ser excluídos.',
        variant: 'warning',
      })
      return
    }
    const ok = await confirm({
      title: 'Excluir perfil',
      message: `Excluir o perfil "${perfil.nome}"? Usuários com este perfil ficarão sem perfil definido.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await deletePerfil(perfil.id)
      await loadPerfis()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir perfil.'
      await alert({ title: 'Erro', message: msg, variant: 'danger' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Equipe</h1>
        <p className="text-gray-600 mt-2">
          Gerencie membros da equipe e perfis de acesso
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setActiveTab('membros')}
          className={`p-4 rounded-lg border-2 transition-all ${
            activeTab === 'membros'
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-gray-200 hover:border-primary/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeTab === 'membros' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Membros</h3>
              <p className="text-sm text-gray-600">Gerencie membros da equipe</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('perfis')}
          className={`p-4 rounded-lg border-2 transition-all ${
            activeTab === 'perfis'
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-gray-200 hover:border-primary/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeTab === 'perfis' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Perfis</h3>
              <p className="text-sm text-gray-600">Configure perfis e permissões</p>
            </div>
          </div>
        </button>
      </div>

      {activeTab === 'membros' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar membros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              onClick={() => {
                setEditingMembro(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Membro
            </button>
          </div>

          {(showForm || editingMembro) && (
            <EquipeMembroForm
              initialData={editingMembro}
              perfis={perfis}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false)
                setEditingMembro(null)
              }}
              loading={saving}
            />
          )}

          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-600">
              Carregando...
            </div>
          ) : (
            <EquipeMembrosTable
              membros={filteredMembros}
              onEdit={(membro) => {
                setEditingMembro(membro)
                setShowForm(true)
              }}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          )}
        </div>
      )}

      {activeTab === 'perfis' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-gray-600">
              Cadastre perfis e defina o que cada um pode visualizar, editar e excluir em cada módulo.
            </p>
            <button
              onClick={() => {
                setEditingPerfil(null)
                setPermissoesPerfil([])
                setShowPerfilForm(true)
              }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Perfil
            </button>
          </div>

          {(showPerfilForm || editingPerfil) && (
            <PerfilPermissoesForm
              initialPerfil={editingPerfil}
              initialPermissoes={permissoesPerfil}
              onSubmit={handlePerfilSubmit}
              onCancel={() => {
                setShowPerfilForm(false)
                setEditingPerfil(null)
                setPermissoesPerfil([])
              }}
              loading={perfisSaving}
            />
          )}

          {perfisLoading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-600">
              Carregando perfis...
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Descrição</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {perfis.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-foreground">{p.nome}</td>
                      <td className="py-3 px-4 text-gray-600">{p.descricao ?? '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleEditPerfil(p)}
                          className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!p.slug && (
                          <button
                            type="button"
                            onClick={() => handleDeletePerfil(p)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
