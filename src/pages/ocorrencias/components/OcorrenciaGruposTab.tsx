import { useMemo, useState } from 'react'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { OcorrenciaGrupo } from '@/types'
import { useOcorrenciaGrupos, useCreateOcorrenciaGrupo, useUpdateOcorrenciaGrupo, useDeleteOcorrenciaGrupo } from '@/hooks/useOcorrencias'
import { updateOcorrenciaGrupo } from '@/services/ocorrencias'
import { useModal } from '@/contexts/ModalContext'

export default function OcorrenciaGruposTab() {
  const { user } = useAuth()
  const { grupos, loading, refetch } = useOcorrenciaGrupos({ includeInactive: true })
  const { create, loading: creating } = useCreateOcorrenciaGrupo()
  const { remove: removeGrupo, loading: deleting } = useDeleteOcorrenciaGrupo()
  const { confirm, alert } = useModal()

  const [editing, setEditing] = useState<OcorrenciaGrupo | null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [isActive, setIsActive] = useState(true)

  const updateHook = useUpdateOcorrenciaGrupo(editing?.id || '')

  const resetForm = () => {
    setEditing(null)
    setNome('')
    setDescricao('')
    setIsActive(true)
  }

  const handleEdit = (grupo: OcorrenciaGrupo) => {
    setEditing(grupo)
    setNome(grupo.nome)
    setDescricao(grupo.descricao || '')
    setIsActive(grupo.is_active)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) {
      await alert({
        title: 'Sessão expirada',
        message: 'Usuário não autenticado. Faça login novamente.',
        variant: 'warning',
      })
      return
    }

    try {
      if (editing) {
        await updateHook.update({ nome, descricao, is_active: isActive })
      } else {
        await create({
          nome,
          descricao: descricao || undefined,
          is_active: isActive,
          responsavel_id: user.id,
        })
      }
      resetForm()
      await refetch()
    } catch (error) {
      console.error('Erro ao salvar grupo:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao salvar grupo. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleToggleActive = async (grupo: OcorrenciaGrupo) => {
    try {
      await updateOcorrenciaGrupo(grupo.id, { is_active: !grupo.is_active })
      await refetch()
    } catch (error) {
      console.error('Erro ao atualizar status do grupo:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao atualizar status. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleDelete = async (grupo: OcorrenciaGrupo) => {
    const ok = await confirm({
      title: 'Inativar grupo',
      message: 'Deseja realmente inativar este grupo?\n\nEsta ação é irreversível.',
      confirmLabel: 'Inativar',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await removeGrupo(grupo.id)
      await refetch()
    } catch (error) {
      console.error('Erro ao inativar grupo:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao inativar grupo. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const grouped = useMemo(() => grupos, [grupos])

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Grupos de Ocorrências</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nome</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ex: Financeiro"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Status</label>
              <select
                value={isActive ? 'ativo' : 'inativo'}
                onChange={(e) => setIsActive(e.target.value === 'ativo')}
                className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Descreva o objetivo do grupo"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={creating || updateHook.loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4 inline-block mr-2" />
              {editing ? 'Salvar alterações' : 'Criar grupo'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
              >
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Grupo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-muted-foreground">Carregando...</td>
              </tr>
            ) : grouped.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-muted-foreground">Nenhum grupo cadastrado</td>
              </tr>
            ) : (
              grouped.map((grupo) => (
                <tr key={grupo.id} className="hover:bg-muted">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{grupo.nome}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{grupo.descricao || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        grupo.is_active ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-muted text-foreground'
                      }`}
                    >
                      {grupo.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(grupo)}
                        className="text-primary hover:text-primary/80"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(grupo)}
                        className="text-muted-foreground hover:text-foreground"
                        title={grupo.is_active ? 'Inativar' : 'Ativar'}
                      >
                        {grupo.is_active ? 'Inativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDelete(grupo)}
                        disabled={deleting}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
