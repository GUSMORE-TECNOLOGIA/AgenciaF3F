import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Package, Edit, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useServicos, useDeleteServico } from '@/hooks/usePlanos'
import { Servico } from '@/types'
import { useModal } from '@/contexts/ModalContext'

export default function Servicos() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAtivo, setFilterAtivo] = useState<boolean | undefined>(undefined)
  const { servicos, loading, refetch } = useServicos(filterAtivo)
  const { remove: deleteServico, loading: deleting } = useDeleteServico()
  const { confirm, alert } = useModal()

  const handleDelete = async (servico: Servico) => {
    const ok = await confirm({
      title: 'Excluir serviço',
      message: `Deseja realmente excluir o serviço \"${servico.nome}\"?\n\nEsta ação é irreversível.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!ok) return

    try {
      await deleteServico(servico.id)
      await refetch()
    } catch (error) {
      console.error('Erro ao excluir serviço:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao excluir serviço. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  const filteredServicos = servicos.filter((servico) => {
    const matchesSearch = servico.nome.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const formatCurrency = (value?: number) => {
    if (!value) return 'Não informado'
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
          <h1 className="text-3xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground mt-1">Cadastro mestre de serviços disponíveis na agência</p>
        </div>
        <Link
          to="/servicos/novo"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Serviço
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
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
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterAtivo(true)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filterAtivo === true
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setFilterAtivo(false)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filterAtivo === false
                  ? 'bg-gray-600 text-white border-gray-600'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              Inativos
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Serviços */}
      {loading ? (
        <div className="bg-card rounded-lg shadow-sm border border-border p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando serviços...</span>
          </div>
        </div>
      ) : filteredServicos.length === 0 ? (
        <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg mb-2">
            {searchTerm || filterAtivo !== undefined
              ? 'Nenhum serviço encontrado com os filtros aplicados'
              : 'Nenhum serviço cadastrado'}
          </p>
          {!searchTerm && filterAtivo === undefined && (
            <Link
              to="/servicos/novo"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar primeiro serviço
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Serviço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredServicos.map((servico) => (
                  <tr key={servico.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">{servico.nome}</div>
                        {servico.descricao && (
                          <div className="text-sm text-muted-foreground mt-1">{servico.descricao}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{formatCurrency(servico.valor)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {servico.ativo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                          <XCircle className="w-3 h-3" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/servicos/${servico.id}/editar`}
                          className="text-primary hover:text-primary/80 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(servico)}
                          disabled={deleting}
                          className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Excluir"
                        >
                          {deleting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
