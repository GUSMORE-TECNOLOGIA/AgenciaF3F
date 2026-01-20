import { useMemo, useState } from 'react'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { OcorrenciaGrupo } from '@/types'
import { useOcorrenciaGrupos, useCreateOcorrenciaGrupo, useUpdateOcorrenciaGrupo, useDeleteOcorrenciaGrupo } from '@/hooks/useOcorrencias'
import { updateOcorrenciaGrupo } from '@/services/ocorrencias'

export default function OcorrenciaGruposTab() {
  const { user } = useAuth()
  const { grupos, loading, refetch } = useOcorrenciaGrupos({ includeInactive: true })
  const { create, loading: creating } = useCreateOcorrenciaGrupo()
  const { remove: removeGrupo, loading: deleting } = useDeleteOcorrenciaGrupo()

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
      alert('Usuário não autenticado. Faça login novamente.')
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
      alert('Erro ao salvar grupo. Tente novamente.')
    }
  }

  const handleToggleActive = async (grupo: OcorrenciaGrupo) => {
    try {
      await updateOcorrenciaGrupo(grupo.id, { is_active: !grupo.is_active })
      await refetch()
    } catch (error) {
      console.error('Erro ao atualizar status do grupo:', error)
      alert('Erro ao atualizar status. Tente novamente.')
    }
  }

  const handleDelete = async (grupo: OcorrenciaGrupo) => {
    if (!confirm('Deseja realmente inativar este grupo?\n\nEsta ação é irreversível.')) return
    try {
      await removeGrupo(grupo.id)
      await refetch()
    } catch (error) {
      console.error('Erro ao inativar grupo:', error)
      alert('Erro ao inativar grupo. Tente novamente.')
    }
  }

  const grouped = useMemo(() => grupos, [grupos])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Grupos de Ocorrências</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ex: Financeiro"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={isActive ? 'ativo' : 'inativo'}
                onChange={(e) => setIsActive(e.target.value === 'ativo')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-gray-500">Carregando...</td>
              </tr>
            ) : grouped.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-gray-500">Nenhum grupo cadastrado</td>
              </tr>
            ) : (
              grouped.map((grupo) => (
                <tr key={grupo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{grupo.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{grupo.descricao || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        grupo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
                        className="text-gray-600 hover:text-gray-900"
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
