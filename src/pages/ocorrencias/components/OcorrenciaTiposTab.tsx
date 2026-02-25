import { useMemo, useState } from 'react'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { OcorrenciaTipo } from '@/types'
import {
  useOcorrenciaGrupos,
  useOcorrenciaTipos,
  useCreateOcorrenciaTipo,
  useUpdateOcorrenciaTipo,
  useDeleteOcorrenciaTipo,
} from '@/hooks/useOcorrencias'
import { updateOcorrenciaTipo } from '@/services/ocorrencias'
import { useModal } from '@/contexts/ModalContext'

export default function OcorrenciaTiposTab() {
  const { user } = useAuth()
  const { grupos } = useOcorrenciaGrupos()
  const { tipos, loading, refetch } = useOcorrenciaTipos({ includeInactive: true })
  const { create, loading: creating } = useCreateOcorrenciaTipo()
  const { remove: removeTipo, loading: deleting } = useDeleteOcorrenciaTipo()
  const { confirm, alert } = useModal()

  const [editing, setEditing] = useState<OcorrenciaTipo | null>(null)
  const [grupoId, setGrupoId] = useState('')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [isActive, setIsActive] = useState(true)

  const updateHook = useUpdateOcorrenciaTipo(editing?.id || '')

  const resetForm = () => {
    setEditing(null)
    setGrupoId('')
    setNome('')
    setDescricao('')
    setIsActive(true)
  }

  const handleEdit = (tipo: OcorrenciaTipo) => {
    setEditing(tipo)
    setGrupoId(tipo.grupo_id)
    setNome(tipo.nome)
    setDescricao(tipo.descricao || '')
    setIsActive(tipo.is_active)
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
    if (!grupoId) {
      await alert({
        title: 'Seleção obrigatória',
        message: 'Selecione um grupo para o tipo.',
        variant: 'warning',
      })
      return
    }

    try {
      if (editing) {
        await updateHook.update({ grupo_id: grupoId, nome, descricao, is_active: isActive })
      } else {
        await create({
          grupo_id: grupoId,
          nome,
          descricao: descricao || undefined,
          is_active: isActive,
          responsavel_id: user.id,
        })
      }
      resetForm()
      await refetch()
    } catch (error) {
      console.error('Erro ao salvar tipo:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao salvar tipo. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleToggleActive = async (tipo: OcorrenciaTipo) => {
    try {
      await updateOcorrenciaTipo(tipo.id, { is_active: !tipo.is_active })
      await refetch()
    } catch (error) {
      console.error('Erro ao atualizar status do tipo:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao atualizar status. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const handleDelete = async (tipo: OcorrenciaTipo) => {
    const ok = await confirm({
      title: 'Inativar tipo',
      message: 'Deseja realmente inativar este tipo?\n\nEsta ação é irreversível.',
      confirmLabel: 'Inativar',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await removeTipo(tipo.id)
      await refetch()
    } catch (error) {
      console.error('Erro ao inativar tipo:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao inativar tipo. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const grupoMap = useMemo(() => new Map(grupos.map((grupo) => [grupo.id, grupo.nome])), [grupos])

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Tipos de Ocorrências</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Grupo</label>
              <select
                value={grupoId}
                onChange={(e) => setGrupoId(e.target.value)}
                className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              >
                <option value="">Selecione um grupo...</option>
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </option>
                ))}
              </select>
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
            <label className="block text-sm font-medium text-foreground mb-1">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Ex: Atraso"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Descreva o tipo"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={creating || updateHook.loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4 inline-block mr-2" />
              {editing ? 'Salvar alterações' : 'Criar tipo'}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Grupo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-muted-foreground">Carregando...</td>
              </tr>
            ) : tipos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-muted-foreground">Nenhum tipo cadastrado</td>
              </tr>
            ) : (
              tipos.map((tipo) => (
                <tr key={tipo.id} className="hover:bg-muted">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{tipo.nome}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{grupoMap.get(tipo.grupo_id) || '-'}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{tipo.descricao || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        tipo.is_active ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-muted text-foreground'
                      }`}
                    >
                      {tipo.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(tipo)}
                        className="text-primary hover:text-primary/80"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(tipo)}
                        className="text-muted-foreground hover:text-foreground"
                        title={tipo.is_active ? 'Inativar' : 'Ativar'}
                      >
                        {tipo.is_active ? 'Inativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDelete(tipo)}
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
