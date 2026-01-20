import { useState, useEffect } from 'react'
import { Plus, Search, Users, Shield } from 'lucide-react'
import { EquipeMembro } from '@/types'
import { fetchEquipeMembros } from '@/services/mockData'

type TabType = 'membros' | 'cargos'

export default function Equipe() {
  const [activeTab, setActiveTab] = useState<TabType>('membros')
  const [membros, setMembros] = useState<EquipeMembro[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadMembros()
  }, [])

  async function loadMembros() {
    try {
      // TODO: Substituir por chamada real ao Supabase quando configurado
      const data = await fetchEquipeMembros()
      setMembros(data)
    } catch (error) {
      console.error('Erro ao carregar membros:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembros = membros.filter((membro) =>
    membro.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membro.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Equipe</h1>
        <p className="text-gray-600 mt-2">
          Gerencie membros da equipe e cargos da agência
        </p>
      </div>

      {/* Tabs */}
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

      {/* Tab Content */}
      {activeTab === 'membros' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
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
            <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              <Plus className="w-5 h-5" />
              Novo Membro
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">Carregando...</div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembros.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Nenhum membro encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredMembros.map((membro) => (
                      <tr key={membro.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {membro.nome_completo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {membro.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {membro.cargo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              membro.status === 'ativo'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {membro.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-primary hover:text-primary/80 font-medium">
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
