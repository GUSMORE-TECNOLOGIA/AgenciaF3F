import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Package, Edit, Trash2, CheckCircle2, XCircle, Loader2, Eye } from 'lucide-react'
import { usePlanos } from '@/hooks/usePlanos'
import { useDeletePlano } from '@/hooks/usePlanos'
import { Plano } from '@/types'

export default function Planos() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAtivo, setFilterAtivo] = useState<boolean | undefined>(undefined)
  const { planos, loading, refetch } = usePlanos(filterAtivo)
  const { remove: deletePlano, loading: deleting } = useDeletePlano()

  const handleDelete = async (plano: Plano) => {
    if (!confirm(`Deseja realmente excluir o plano "${plano.nome}"?\n\nEsta ação é irreversível.`)) {
      return
    }

    try {
      await deletePlano(plano.id)
      await refetch()
    } catch (error) {
      console.error('Erro ao excluir plano:', error)
      alert('Erro ao excluir plano. Tente novamente.')
    }
  }

  const filteredPlanos = planos.filter((plano) => {
    const matchesSearch = plano.nome.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planos</h1>
          <p className="text-gray-600 mt-1">Cadastro de planos da agência (pacotes de serviços)</p>
        </div>
        <Link
          to="/planos/novo"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Plano
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar planos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Filtro de Status */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterAtivo(undefined)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filterAtivo === undefined
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterAtivo(true)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filterAtivo === true
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setFilterAtivo(false)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filterAtivo === false
                  ? 'bg-gray-600 text-white border-gray-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Inativos
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Planos */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-600">Carregando planos...</span>
          </div>
        </div>
      ) : filteredPlanos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">
            {searchTerm || filterAtivo !== undefined
              ? 'Nenhum plano encontrado com os filtros aplicados'
              : 'Nenhum plano cadastrado'}
          </p>
          {!searchTerm && filterAtivo === undefined && (
            <Link
              to="/planos/novo"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar primeiro plano
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlanos.map((plano) => (
            <div
              key={plano.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{plano.nome}</h3>
                    {plano.descricao && (
                      <p className="text-sm text-gray-600 line-clamp-2">{plano.descricao}</p>
                    )}
                  </div>
                  {plano.ativo ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  )}
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-bold text-primary">{formatCurrency(plano.valor)}</div>
                  <div className="text-xs text-gray-500 mt-1">Valor fixo do plano</div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <Link
                    to={`/planos/${plano.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </Link>
                  <Link
                    to={`/planos/${plano.id}/editar`}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(plano)}
                    disabled={deleting}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Excluir"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
