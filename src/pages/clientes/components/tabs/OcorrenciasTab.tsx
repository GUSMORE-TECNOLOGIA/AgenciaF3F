import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Edit, Trash2 } from 'lucide-react'
import { useOcorrencias, useDeleteOcorrencia, useOcorrenciaGrupos, useOcorrenciaTipos } from '@/hooks/useOcorrencias'
import { Ocorrencia } from '@/types'

interface OcorrenciasTabProps {
  clienteId: string
  clienteNome: string
}

export default function OcorrenciasTab({ clienteId, clienteNome }: OcorrenciasTabProps) {
  const { ocorrencias, loading, refetch } = useOcorrencias({ cliente_id: clienteId })
  const { remove: deleteOcorrencia, loading: deleting } = useDeleteOcorrencia()
  const { grupos } = useOcorrenciaGrupos()
  const { tipos } = useOcorrenciaTipos()

  const grupoMap = useMemo(() => new Map(grupos.map((grupo) => [grupo.id, grupo.nome])), [grupos])
  const tipoMap = useMemo(() => new Map(tipos.map((tipo) => [tipo.id, tipo.nome])), [tipos])

  const handleDelete = async (ocorrencia: Ocorrencia) => {
    if (!confirm('Deseja realmente excluir esta ocorrência?\n\nEsta ação é irreversível.')) return
    try {
      await deleteOcorrencia(ocorrencia.id)
      await refetch()
    } catch (error) {
      console.error('Erro ao excluir ocorrência:', error)
      alert('Erro ao excluir ocorrência. Tente novamente.')
    }
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ocorrências</h3>
          <p className="text-sm text-gray-600">Histórico de ocorrências de {clienteNome}</p>
        </div>
        <Link
          to={`/ocorrencias/nova?cliente_id=${clienteId}`}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          Nova Ocorrência
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-600">
          Carregando ocorrências...
        </div>
      ) : ocorrencias.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-600">
          Nenhuma ocorrência registrada
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ocorrencias.map((ocorrencia) => (
                <tr key={ocorrencia.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{grupoMap.get(ocorrencia.grupo_id) || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{tipoMap.get(ocorrencia.tipo_id) || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(ocorrencia.ocorreu_em)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{ocorrencia.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/ocorrencias/${ocorrencia.id}/editar`}
                        className="text-primary hover:text-primary/80"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(ocorrencia)}
                        disabled={deleting}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
