import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useOcorrencias, useOcorrenciaGrupos, useOcorrenciaTipos } from '@/hooks/useOcorrencias'
import { useClientes } from '@/hooks/useClientes'
import { updateOcorrencia } from '@/services/ocorrencias'
import { useModal } from '@/contexts/ModalContext'

export default function OcorrenciaLembretesTab() {
  const { ocorrencias, loading, refetch } = useOcorrencias({ reminder_status: 'pendente' })
  const { clientes } = useClientes({ autoFetch: true, limit: 1000 })
  const { grupos } = useOcorrenciaGrupos()
  const { tipos } = useOcorrenciaTipos()
  const { alert } = useModal()

  const grupoMap = useMemo(() => new Map(grupos.map((grupo) => [grupo.id, grupo.nome])), [grupos])
  const tipoMap = useMemo(() => new Map(tipos.map((tipo) => [tipo.id, tipo.nome])), [tipos])

  const lembretes = useMemo(
    () => ocorrencias.filter((ocorrencia) => !!ocorrencia.reminder_at),
    [ocorrencias]
  )

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  const handleMark = async (id: string, status: 'feito' | 'cancelado') => {
    try {
      await updateOcorrencia(id, { reminder_status: status })
      await refetch()
    } catch (error) {
      console.error('Erro ao atualizar lembrete:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao atualizar lembrete. Tente novamente.',
        variant: 'danger',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Lembretes de Ocorrências</h2>
        <p className="text-gray-600">Pendências programadas para acompanhamento</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <span className="text-gray-600">Carregando lembretes...</span>
        </div>
      ) : lembretes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-600">
          Nenhum lembrete pendente
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lembrete</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lembretes.map((ocorrencia) => {
                const cliente = clientes.find((c) => c.id === ocorrencia.cliente_id)
                return (
                  <tr key={ocorrencia.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/clientes/${ocorrencia.cliente_id}/editar`}
                        className="text-primary hover:underline"
                      >
                        {cliente?.nome || 'Cliente não encontrado'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {grupoMap.get(ocorrencia.grupo_id) || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tipoMap.get(ocorrencia.tipo_id) || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ocorrencia.reminder_at ? formatDateTime(ocorrencia.reminder_at) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleMark(ocorrencia.id, 'feito')}
                          className="text-green-600 hover:text-green-800"
                          title="Marcar como feito"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMark(ocorrencia.id, 'cancelado')}
                          className="text-red-600 hover:text-red-800"
                          title="Cancelar lembrete"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/ocorrencias/${ocorrencia.id}/editar`}
                          className="text-primary hover:text-primary/80"
                        >
                          Ver ocorrência
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
