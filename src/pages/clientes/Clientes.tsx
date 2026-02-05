import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit } from 'lucide-react'
import { useClientes } from '@/hooks/useClientes'
import { fetchPrincipaisParaLista } from '@/services/usuarios'
import { fetchClientePlanos } from '@/services/planos'
import type { ClientePlano } from '@/types'

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ativo' | 'inativo' | 'pausado' | ''>('')
  const [responsavelFilter, setResponsavelFilter] = useState<string>('')
  const [principais, setPrincipais] = useState<Array<{ cliente_id: string; responsavel_id: string; responsavel_name: string }>>([])
  const [planosAtivos, setPlanosAtivos] = useState<Map<string, string>>(new Map())

  // Buscar clientes sem filtro de search (só status)
  const { clientes: clientesRaw, loading, error, refetch } = useClientes({
    status: statusFilter || undefined,
    limit: 500, // Buscar todos para filtrar client-side
  })

  useEffect(() => {
    fetchPrincipaisParaLista().then(setPrincipais)
  }, [])

  // Buscar planos ativos de todos os clientes
  useEffect(() => {
    if (clientesRaw.length === 0) return
    Promise.all(
      clientesRaw.map(async (c) => {
        const planos = await fetchClientePlanos(c.id)
        const ativo = planos.find((p) => p.status === 'ativo')
        return { clienteId: c.id, planoNome: ativo?.plano?.nome }
      })
    ).then((results) => {
      const map = new Map<string, string>()
      results.forEach((r) => {
        if (r.planoNome) map.set(r.clienteId, r.planoNome)
      })
      setPlanosAtivos(map)
    })
  }, [clientesRaw])

  const responsavelPorClienteMap = useMemo(
    () => new Map(principais.map((p) => [p.cliente_id, p.responsavel_name])),
    [principais]
  )
  const responsavelIdPorClienteMap = useMemo(
    () => new Map(principais.map((p) => [p.cliente_id, p.responsavel_id])),
    [principais]
  )
  const responsaveisUnicos = useMemo(() => {
    const seen = new Set<string>()
    return principais.filter((p) => {
      if (!p.responsavel_id || seen.has(p.responsavel_id)) return false
      seen.add(p.responsavel_id)
      return true
    })
  }, [principais])

  // Filtro client-side: busca + responsável; não causa re-fetch
  const clientes = useMemo(() => {
    let list = clientesRaw
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.nome.toLowerCase().includes(term) ||
          (c.email || '').toLowerCase().includes(term) ||
          (c.telefone || '').toLowerCase().includes(term)
      )
    }
    if (responsavelFilter) {
      list = list.filter((c) => responsavelIdPorClienteMap.get(c.id) === responsavelFilter)
    }
    return list
  }, [clientesRaw, searchTerm, responsavelFilter, responsavelIdPorClienteMap])

  const total = clientes.length

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Erro ao carregar clientes: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
        <Link
          to="/clientes/novo"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar clientes por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="pausado">Pausado</option>
            <option value="inativo">Inativo</option>
          </select>
          <select
            value={responsavelFilter}
            onChange={(e) => setResponsavelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            title="Filtrar por responsável"
          >
            <option value="">Todos os responsáveis</option>
            {responsaveisUnicos.map((r) => (
              <option key={r.responsavel_id} value={r.responsavel_id}>
                {r.responsavel_name || '(sem nome)'}
              </option>
            ))}
          </select>
        </div>
        {clientes.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {clientes.length} {clientes.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                E-mail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plano Atual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Responsável
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
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm || statusFilter || responsavelFilter
                    ? 'Nenhum cliente encontrado com os filtros aplicados'
                    : 'Nenhum cliente cadastrado ainda'}
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link
                      to={`/clientes/${cliente.id}/editar`}
                      className="text-primary hover:text-primary/80 hover:underline"
                      title="Editar cliente"
                    >
                      {cliente.nome}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.telefone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {planosAtivos.get(cliente.id) || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {responsavelPorClienteMap.get(cliente.id) ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        cliente.status === 'ativo'
                          ? 'bg-green-100 text-green-800'
                          : cliente.status === 'pausado'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {cliente.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      to={`/clientes/${cliente.id}/editar`}
                      className="text-primary hover:text-primary/80 inline-flex items-center gap-1 font-medium"
                      title="Editar cliente"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Editar</span>
                    </Link>
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
