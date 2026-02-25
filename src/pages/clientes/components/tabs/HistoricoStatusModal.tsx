import { useState, useEffect } from 'react'
import { X, Clock, Loader2 } from 'lucide-react'
import { fetchHistoricoStatusContrato, type ContratoStatusHistorico } from '@/services/historico'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface HistoricoStatusModalProps {
  tipoContrato: 'plano' | 'servico'
  contratoId: string
  contratoNome: string
  isOpen: boolean
  onClose: () => void
}

export default function HistoricoStatusModal({
  tipoContrato,
  contratoId,
  contratoNome,
  isOpen,
  onClose,
}: HistoricoStatusModalProps) {
  const [historico, setHistorico] = useState<ContratoStatusHistorico[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (isOpen && contratoId) {
      loadHistorico()
    }
  }, [isOpen, contratoId])

  const loadHistorico = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchHistoricoStatusContrato(tipoContrato, contratoId)
      setHistorico(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      console.error('Erro ao carregar histórico:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      ativo: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-300' },
      pausado: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-300' },
      cancelado: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-300' },
      finalizado: { bg: 'bg-muted', text: 'text-foreground' },
    }

    const config = statusConfig[status] || statusConfig.ativo

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {status}
      </span>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Histórico de Status</h2>
            <p className="text-sm text-muted-foreground mt-1">{contratoNome}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando histórico...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Erro ao carregar histórico: {error.message}</p>
              <button
                onClick={loadHistorico}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p>Nenhuma mudança de status registrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historico.map((item, index) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    {index < historico.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {item.status_anterior && (
                        <>
                          {getStatusBadge(item.status_anterior)}
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      {getStatusBadge(item.status_novo)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                    {item.observacoes && (
                      <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                        {item.observacoes}
                      </div>
                    )}
                    {item.metadata && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.metadata.valor_anterior !== item.metadata.valor_novo && (
                          <span>
                            Valor: R${' '}
                            {Number(item.metadata.valor_anterior || 0).toFixed(2).replace('.', ',')}{' '}
                            → R${' '}
                            {Number(item.metadata.valor_novo || 0).toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
