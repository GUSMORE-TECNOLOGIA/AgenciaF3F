import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { ClienteContrato } from '@/types'
import { useUpdateClienteContrato } from '@/hooks/usePlanos'
import { clienteContratoUpdateSchema, type ClienteContratoUpdateInput, DATE_MIN, DATE_MAX } from '@/lib/validators/plano-schema'
import { useModal } from '@/contexts/ModalContext'
import { getTodayISO } from '@/lib/dateUtils'

interface EditClienteContratoModalProps {
  contrato: ClienteContrato
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditClienteContratoModal({
  contrato,
  isOpen,
  onClose,
  onSuccess,
}: EditClienteContratoModalProps) {
  const { update, loading } = useUpdateClienteContrato(contrato.id)
  const { alert } = useModal()
  const [formData, setFormData] = useState<ClienteContratoUpdateInput>({
    nome: contrato.nome ?? '',
    status: contrato.status,
    contrato_assinado: contrato.contrato_assinado ?? 'nao_assinado',
    data_inicio: contrato.data_inicio ?? undefined,
    data_fim: contrato.data_fim ?? undefined,
    data_assinatura: contrato.data_assinatura ?? undefined,
    data_cancelamento: contrato.data_cancelamento ?? undefined,
    observacoes: contrato.observacoes ?? '',
  })
  const [_errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && contrato) {
      setFormData({
        nome: contrato.nome ?? '',
        status: contrato.status,
        contrato_assinado: contrato.contrato_assinado ?? 'nao_assinado',
        data_inicio: contrato.data_inicio ?? undefined,
        data_fim: contrato.data_fim ?? undefined,
        data_assinatura: contrato.data_assinatura ?? undefined,
        data_cancelamento: contrato.data_cancelamento ?? undefined,
        observacoes: contrato.observacoes ?? '',
      })
      setErrors({})
    }
  }, [isOpen, contrato])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      const validated = clienteContratoUpdateSchema.parse(formData)
      await update(validated)
      onSuccess()
      onClose()
    } catch (error: any) {
      if (error.errors) {
        const zodErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            zodErrors[err.path[0]] = err.message
          }
        })
        setErrors(zodErrors)
      } else {
        console.error('Erro ao atualizar contrato:', error)
        await alert({
          title: 'Erro',
          message: 'Erro ao atualizar contrato. Tente novamente.',
          variant: 'danger',
        })
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Editar Contrato</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-foreground mb-2">
                Nome / Identificador
              </label>
              <input
                id="nome"
                type="text"
                value={formData.nome ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Ex.: Contrato 2025-01"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status_contrato" className="block text-sm font-medium text-foreground mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status_contrato"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as 'ativo' | 'pausado' | 'cancelado' | 'finalizado',
                    }))
                  }
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                >
                  <option value="ativo">Ativo</option>
                  <option value="pausado">Pausado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
              <div>
                <label htmlFor="contrato_assinado_edit" className="block text-sm font-medium text-foreground mb-2">
                  Contrato
                </label>
                <select
                  id="contrato_assinado_edit"
                  value={formData.contrato_assinado ?? 'nao_assinado'}
                  onChange={(e) => {
                    const val = e.target.value as 'assinado' | 'nao_assinado' | 'cancelado'
                    setFormData((prev) => {
                      const next = { ...prev, contrato_assinado: val }
                      if (val === 'assinado' && !prev.data_assinatura) {
                        next.data_assinatura = getTodayISO()
                      }
                      return next
                    })
                  }}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                  <option value="nao_assinado">Não assinado</option>
                  <option value="assinado">Assinado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="data_inicio_contrato" className="block text-sm font-medium text-foreground mb-2">
                  Data de Início
                </label>
                <input
                  id="data_inicio_contrato"
                  type="date"
                  value={formData.data_inicio ?? ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, data_inicio: e.target.value || undefined }))
                  }
                  min={DATE_MIN}
                  max={DATE_MAX}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="data_fim_contrato" className="block text-sm font-medium text-foreground mb-2">
                  Data de Fim
                </label>
                <input
                  id="data_fim_contrato"
                  type="date"
                  value={formData.data_fim ?? ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, data_fim: e.target.value || undefined }))
                  }
                  min={formData.data_inicio ?? DATE_MIN}
                  max={DATE_MAX}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="data_assinatura_contrato" className="block text-sm font-medium text-foreground mb-2">
                  Data de Assinatura
                </label>
                <input
                  id="data_assinatura_contrato"
                  type="date"
                  value={formData.data_assinatura ?? ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, data_assinatura: e.target.value || undefined }))
                  }
                  min={DATE_MIN}
                  max={DATE_MAX}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="data_cancelamento_contrato" className="block text-sm font-medium text-foreground mb-2">
                  Data de Cancelamento
                </label>
                <input
                  id="data_cancelamento_contrato"
                  type="date"
                  value={formData.data_cancelamento ?? ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, data_cancelamento: e.target.value || undefined }))
                  }
                  min={DATE_MIN}
                  max={DATE_MAX}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="observacoes_contrato" className="block text-sm font-medium text-foreground mb-2">
                Observações
              </label>
              <textarea
                id="observacoes_contrato"
                value={formData.observacoes ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Observações sobre o contrato..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
