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

export default function OcorrenciaTiposTab() {
  const { user } = useAuth()
  const { grupos } = useOcorrenciaGrupos()
  const { tipos, loading, refetch } = useOcorrenciaTipos({ includeInactive: true })
  const { create, loading: creating } = useCreateOcorrenciaTipo()
  const { remove: removeTipo, loading: deleting } = useDeleteOcorrenciaTipo()

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
      alert('Usuário não autenticado. Faça login novamente.')
      return
    }
    if (!grupoId) {
      alert('Selecione um grupo para o tipo.')
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
      alert('Erro ao salvar tipo. Tente novamente.')
    }
  }

  const handleToggleActive = async (tipo: OcorrenciaTipo) => {
    try {
      await updateOcorrenciaTipo(tipo.id, { is_active: !tipo.is_active })
      await refetch()
    } catch (error) {
      console.error('Erro ao atualizar status do tipo:', error)
      alert('Erro ao atualizar status. Tente novamente.')
    }
  }

  const handleDelete = async (tipo: OcorrenciaTipo) => {
    if (!confirm('Deseja realmente inativar este tipo?\n\nEsta ação é irreversível.')) return
    try {
      await removeTipo(tipo.id)
      await refetch()
    } catch (error) {
      console.error('Erro ao inativar tipo:', error)
      alert('Erro ao inativar tipo. Tente novamente.')
    }
  }

  const grupoMap = useMemo(() => new Map(grupos.map((grupo) => [grupo.id, grupo.nome])), [grupos])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Tipos de Ocorrências</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
              <select
                value={grupoId}
                onChange={(e) => setGrupoId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Ex: Atraso"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-gray-500">Carregando...</td>
              </tr>
            ) : tipos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-gray-500">Nenhum tipo cadastrado</td>
              </tr>
            ) : (
              tipos.map((tipo) => (
                <tr key={tipo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tipo.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{grupoMap.get(tipo.grupo_id) || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{tipo.descricao || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        tipo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
                        className="text-gray-600 hover:text-gray-900"
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
