import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Users, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { EquipeMembro } from '@/types'
import {
  createEquipeMembro,
  deleteEquipeMembro,
  fetchEquipeMembros,
  updateEquipeMembro,
  type EquipeMembroInput,
} from '@/services/equipe'
import EquipeMembroForm from './components/EquipeMembroForm'
import EquipeMembrosTable from './components/EquipeMembrosTable'

type TabType = 'membros' | 'cargos'

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

  useEffect(() => {
    loadMembros()
  }, [])

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
      alert('Usuário não autenticado. Faça login novamente.')
      return
    }

    try {
      setSaving(true)
      if (editingMembro) {
        await updateEquipeMembro(editingMembro.id, data)
      } else {
        await createEquipeMembro(data, user.id)
      }
      setShowForm(false)
      setEditingMembro(null)
      await loadMembros()
    } catch (error) {
      console.error('Erro ao salvar membro:', error)
      alert('Erro ao salvar membro. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (membro: EquipeMembro) => {
    const ok = confirm('Deseja realmente excluir este membro da equipe?\n\nEsta ação é irreversível.')
    if (!ok) return

    try {
      setDeletingId(membro.id)
      await deleteEquipeMembro(membro.id)
      await loadMembros()
    } catch (error) {
      console.error('Erro ao excluir membro:', error)
      alert('Erro ao excluir membro. Tente novamente.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Equipe</h1>
        <p className="text-gray-600 mt-2">
          Gerencie membros da equipe e cargos da agência
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
          onClick={() => setActiveTab('cargos')}
          className={`p-4 rounded-lg border-2 transition-all ${
            activeTab === 'cargos'
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-gray-200 hover:border-primary/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeTab === 'cargos' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Cargos</h3>
              <p className="text-sm text-gray-600">Configure cargos e permissões</p>
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

      {activeTab === 'cargos' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Cargos e Permissões</h2>
          <p className="text-gray-600">
            Configure cargos e permissões da equipe. (Em desenvolvimento)
          </p>
        </div>
      )}
    </div>
  )
}
