import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Users, Shield, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { EquipeMembro, Perfil } from '@/types'
import {
  createEquipeMembro,
  deleteEquipeMembro,
  fetchEquipeMembros,
  updateEquipeMembro,
  type EquipeMembroInput,
} from '@/services/equipe'
import { fetchUsuarioIdByEmail, updateUsuarioNameAndPerfil } from '@/services/usuarios'
import {
  createPerfil,
  deletePerfil,
  fetchPerfis,
  fetchPermissoesByPerfil,
  perfilEmUso,
  savePermissoes,
  updatePerfil,
} from '@/services/perfis'
import { createTeamUser } from '@/services/createTeamUser'
import { adminUpdateUserPassword } from '@/services/adminUpdateUserPassword'
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
  const [sendingResetEmailId, setSendingResetEmailId] = useState<string | null>(null)
  const [editingPasswordMembro, setEditingPasswordMembro] = useState<EquipeMembro | null>(null)
  const [updatingPasswordId, setUpdatingPasswordId] = useState<string | null>(null)
  const [creatingAccessId, setCreatingAccessId] = useState<string | null>(null)
  const [editPasswordNew, setEditPasswordNew] = useState('')
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('')
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
        let userIdToUpdate = editingMembro.user_id ?? null
        if (!userIdToUpdate) {
          const email = (data.email ?? editingMembro.email ?? '').trim()
          if (email) {
            const resolvedId = await fetchUsuarioIdByEmail(email)
            if (resolvedId) {
              userIdToUpdate = resolvedId
              await updateEquipeMembro(editingMembro.id, { ...data, user_id: resolvedId })
            } else {
              await updateEquipeMembro(editingMembro.id, data)
            }
          } else {
            await updateEquipeMembro(editingMembro.id, data)
          }
        } else {
          await updateEquipeMembro(editingMembro.id, data)
        }
        if (userIdToUpdate) {
          await updateUsuarioNameAndPerfil(userIdToUpdate, {
            name: data.nome_completo,
            perfil_id: data.perfil_id ?? null,
          })
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
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'Erro ao salvar membro. Tente novamente.'
      await alert({ title: 'Erro', message: msg, variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const handleEditPassword = (membro: EquipeMembro) => {
    if (membro.user_id) setEditingPasswordMembro(membro)
  }

  const handleCreateAccess = async (membro: EquipeMembro) => {
    const emailToUse = (membro.email ?? '').trim()
    if (!emailToUse) {
      await alert({
        title: 'E-mail ausente',
        message: 'Cadastre um e-mail no membro (editar) para depois criar o acesso.',
        variant: 'warning',
      })
      return
    }
    if (!user) {
      await alert({
        title: 'Sessão expirada',
        message: 'Faça login novamente.',
        variant: 'warning',
      })
      return
    }
    try {
      setCreatingAccessId(membro.id)
      const { id: userId, created } = await createTeamUser({
        email: emailToUse,
        name: membro.nome_completo,
        perfil: membro.perfil,
        perfil_id: membro.perfil_id ?? undefined,
      })
      await updateEquipeMembro(membro.id, {
        nome_completo: membro.nome_completo,
        email: membro.email ?? undefined,
        telefone: membro.telefone ?? undefined,
        perfil: membro.perfil,
        status: membro.status,
        perfil_id: membro.perfil_id ?? undefined,
        user_id: userId,
      })
      await updateUsuarioNameAndPerfil(userId, {
        name: membro.nome_completo,
        perfil_id: membro.perfil_id ?? null,
      })
      await loadMembros()
      if (created) {
        await alert({
          title: 'Acesso criado',
          message: `Usuário de acesso criado para ${membro.nome_completo}. Senha padrão: 123456. Ele(a) pode alterar em "Alterar senha" ou você pode definir com "Editar senha".`,
          variant: 'success',
        })
      } else {
        await alert({
          title: 'E-mail já cadastrado',
          message: `Este e-mail já possuía acesso. Membro vinculado ao usuário existente. Use "Editar senha" para definir uma nova senha.`,
          variant: 'success',
        })
        setEditingPasswordMembro({ ...membro, user_id: userId })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar usuário de acesso.'
      await alert({ title: 'Erro', message: msg, variant: 'danger' })
    } finally {
      setCreatingAccessId(null)
    }
  }

  const handleSendPasswordReset = async (membro: EquipeMembro) => {
    const emailToUse = (membro.email ?? '').trim()
    if (!emailToUse) {
      await alert({
        title: 'E-mail ausente',
        message: 'Este membro não possui e-mail cadastrado.',
        variant: 'warning',
      })
      return
    }
    try {
      setSendingResetEmailId(membro.id)
      const redirectTo = `${window.location.origin}/alterar-senha`
      const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, { redirectTo })
      if (error) throw error
      await alert({
        title: 'E-mail enviado',
        message: `Se o e-mail estiver cadastrado, ${membro.nome_completo} receberá um link para redefinir a senha.`,
        variant: 'success',
      })
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Erro ao enviar e-mail de redefinição.'
      const isRateLimit = String(raw).toLowerCase().includes('rate limit')
      const msg = isRateLimit
        ? 'Muitas solicitações de e-mail no momento. O Supabase limita a quantidade de e-mails de redefinição por hora. Tente novamente em alguns minutos.'
        : raw
      await alert({ title: 'Erro', message: msg, variant: 'danger' })
    } finally {
      setSendingResetEmailId(null)
    }
  }

  const handleSaveNewPassword = async () => {
    if (!editingPasswordMembro?.user_id) return
    if (!editPasswordNew || editPasswordNew.length < 8) {
      await alert({
        title: 'Senha inválida',
        message: 'A nova senha deve ter pelo menos 8 caracteres.',
        variant: 'warning',
      })
      return
    }
    if (editPasswordNew !== editPasswordConfirm) {
      await alert({
        title: 'Senhas não conferem',
        message: 'Digite a mesma senha nos dois campos.',
        variant: 'warning',
      })
      return
    }
    try {
      setUpdatingPasswordId(editingPasswordMembro.id)
      await adminUpdateUserPassword(editingPasswordMembro.user_id, editPasswordNew)
      setEditingPasswordMembro(null)
      setEditPasswordNew('')
      setEditPasswordConfirm('')
      await alert({
        title: 'Senha alterada',
        message: `A senha de ${editingPasswordMembro.nome_completo} foi atualizada. Ele(a) já pode entrar com a nova senha.`,
        variant: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar senha.'
      await alert({ title: 'Erro', message: msg, variant: 'danger' })
    } finally {
      setUpdatingPasswordId(null)
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
    const emUso = await perfilEmUso(perfil.id)
    if (emUso) {
      await alert({
        title: 'Perfil em uso',
        message: 'Não é possível excluir: existem usuários vinculados a este perfil. Desvincule-os antes de excluir.',
        variant: 'warning',
      })
      return
    }
    const ok = await confirm({
      title: 'Excluir perfil',
      message: `Excluir o perfil "${perfil.nome}"?`,
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
              key={editingMembro?.id ?? 'new'}
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
              perfis={perfis}
              onEdit={(membro) => {
                setEditingMembro(membro)
                setShowForm(true)
              }}
              onEditPassword={handleEditPassword}
              onCreateAccess={handleCreateAccess}
              onSendPasswordReset={handleSendPasswordReset}
              sendingResetEmailId={sendingResetEmailId}
              updatingPasswordId={updatingPasswordId}
              creatingAccessId={creatingAccessId}
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
                        <button
                          type="button"
                          onClick={() => handleDeletePerfil(p)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editingPasswordMembro && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Editar senha – {editingPasswordMembro.nome_completo}
            </h3>
            <p className="text-sm text-gray-600">
              Defina uma nova senha. O usuário poderá entrar com ela na próxima vez.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
              <input
                type="password"
                value={editPasswordNew}
                onChange={(e) => setEditPasswordNew(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
              <input
                type="password"
                value={editPasswordConfirm}
                onChange={(e) => setEditPasswordConfirm(e.target.value)}
                placeholder="Repita a senha"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                autoComplete="new-password"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingPasswordMembro(null)
                  setEditPasswordNew('')
                  setEditPasswordConfirm('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNewPassword}
                disabled={updatingPasswordId === editingPasswordMembro.id}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {updatingPasswordId === editingPasswordMembro.id ? 'Salvando...' : 'Salvar senha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
