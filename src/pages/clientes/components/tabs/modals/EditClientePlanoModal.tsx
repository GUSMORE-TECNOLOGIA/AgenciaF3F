import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { ClientePlano } from '@/types'
import { useUpdateClientePlano } from '@/hooks/usePlanos'
import { clientePlanoUpdateSchema, type ClientePlanoUpdateInput, DATE_MIN, DATE_MAX } from '@/lib/validators/plano-schema'
import { useModal } from '@/contexts/ModalContext'
import { useAuth } from '@/contexts/AuthContext'
import InputMoeda from '@/components/ui/InputMoeda'

interface EditClientePlanoModalProps {
  contrato: ClientePlano
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditClientePlanoModal({
  contrato,
  isOpen,
  onClose,
  onSuccess,
}: EditClientePlanoModalProps) {
  const { update, loading } = useUpdateClientePlano(contrato.id)
  const { alert } = useModal()
  const { canSuperEditPlanos } = useAuth()
  const [formData, setFormData] = useState<ClientePlanoUpdateInput>({
    valor: contrato.valor,
    moeda: contrato.moeda,
    status: contrato.status,
    contrato_assinado: contrato.contrato_assinado ?? 'nao_assinado',
    data_inicio: contrato.data_inicio ?? undefined,
    data_fim: contrato.data_fim ?? undefined,
    data_assinatura: contrato.data_assinatura ?? undefined,
    data_cancelamento: contrato.data_cancelamento ?? undefined,
    observacoes: contrato.observacoes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && contrato) {
      setFormData({
        valor: contrato.valor,
        moeda: contrato.moeda,
        status: contrato.status,
        contrato_assinado: contrato.contrato_assinado ?? 'nao_assinado',
        data_inicio: contrato.data_inicio ?? undefined,
        data_fim: contrato.data_fim ?? undefined,
        data_assinatura: contrato.data_assinatura ?? undefined,
        data_cancelamento: contrato.data_cancelamento ?? undefined,
        observacoes: contrato.observacoes || '',
      })
      setErrors({})
    }
  }, [isOpen, contrato])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      const payload: ClientePlanoUpdateInput = canSuperEditPlanos
        ? formData
        : { status: formData.status, contrato_assinado: formData.contrato_assinado, observacoes: formData.observacoes }
      const validated = clientePlanoUpdateSchema.parse(payload)
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
          <h2 className="text-xl font-bold text-foreground">Editar Contrato de Plano</h2>
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
            {/* Informações do Plano */}
            <div className="p-4 bg-muted rounded-lg border border-border">
              <div className="text-sm font-medium text-foreground mb-2">Plano</div>
              <div className="text-lg font-semibold text-foreground">
                {contrato.plano?.nome || 'Plano não encontrado'}
              </div>
              {contrato.plano && (
                <div className="text-sm text-muted-foreground mt-1">
                  Valor original: R$ {contrato.plano.valor.toFixed(2).replace('.', ',')}
                </div>
              )}
            </div>

            {/* Valor (apenas Super Edit: admin ou financeiro) */}
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-foreground mb-2">
                Valor do Contrato (R$) <span className="text-red-500">*</span>
                {!canSuperEditPlanos && (
                  <span className="ml-2 text-xs text-muted-foreground">(apenas troca de status)</span>
                )}
              </label>
              <InputMoeda
                id="valor"
                value={formData.valor ?? ''}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, valor: v ?? 0 }))}
                readOnly={!canSuperEditPlanos}
                className={`w-full px-4 py-2 bg-background text-foreground border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.valor ? 'border-red-500' : 'border-border'
                } ${!canSuperEditPlanos ? 'bg-muted cursor-not-allowed' : ''}`}
                aria-invalid={!!errors.valor}
                aria-describedby={errors.valor ? 'valor-error' : undefined}
              />
              {errors.valor && <p id="valor-error" className="mt-1 text-sm text-red-600">{errors.valor}</p>}
            </div>

            {/* Moeda */}
            <div>
              <label htmlFor="moeda" className="block text-sm font-medium text-foreground mb-2">
                Moeda
              </label>
              <select
                id="moeda"
                value={formData.moeda}
                onChange={(e) => setFormData((prev) => ({ ...prev, moeda: e.target.value }))}
                disabled={!canSuperEditPlanos}
                className={`w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  !canSuperEditPlanos ? 'bg-muted cursor-not-allowed' : ''
                }`}
              >
                <option value="BRL">BRL - Real Brasileiro</option>
                <option value="USD">USD - Dólar Americano</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            {/* Data Início / Data Fim (apenas Super Edit) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="data_inicio" className="block text-sm font-medium text-foreground mb-2">
                  Data de Início
                </label>
                <input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio ?? ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, data_inicio: e.target.value || undefined }))
                  }
                  min={DATE_MIN}
                  max={DATE_MAX}
                  readOnly={!canSuperEditPlanos}
                  className={`w-full px-4 py-2 bg-background text-foreground border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                    errors.data_inicio ? 'border-red-500' : 'border-border'
                  } ${!canSuperEditPlanos ? 'bg-muted cursor-not-allowed' : ''}`}
                />
                {errors.data_inicio && (
                  <p className="mt-1 text-sm text-red-600">{errors.data_inicio}</p>
                )}
              </div>
              <div>
                <label htmlFor="data_fim" className="block text-sm font-medium text-foreground mb-2">
                  Data de Fim
                </label>
                <input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim ?? ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, data_fim: e.target.value || undefined }))
                  }
                  min={formData.data_inicio ?? DATE_MIN}
                  max={DATE_MAX}
                  readOnly={!canSuperEditPlanos}
                  className={`w-full px-4 py-2 bg-background text-foreground border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                    errors.data_fim ? 'border-red-500' : 'border-border'
                  } ${!canSuperEditPlanos ? 'bg-muted cursor-not-allowed' : ''}`}
                />
                {errors.data_fim && <p className="mt-1 text-sm text-red-600">{errors.data_fim}</p>}
              </div>
            </div>

            {canSuperEditPlanos && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="data_assinatura_plano" className="block text-sm font-medium text-foreground mb-2">
                    Data de Assinatura
                  </label>
                  <input
                    id="data_assinatura_plano"
                    type="date"
                    value={formData.data_assinatura ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, data_assinatura: e.target.value || undefined }))
                    }
                    min={DATE_MIN}
                    max={DATE_MAX}
                    className={`w-full px-4 py-2 bg-background text-foreground border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                      errors.data_assinatura ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  {errors.data_assinatura && <p className="mt-1 text-sm text-red-600">{errors.data_assinatura}</p>}
                </div>
                <div>
                  <label htmlFor="data_cancelamento_plano" className="block text-sm font-medium text-foreground mb-2">
                    Data de Cancelamento
                  </label>
                  <input
                    id="data_cancelamento_plano"
                    type="date"
                    value={formData.data_cancelamento ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, data_cancelamento: e.target.value || undefined }))
                    }
                    min={DATE_MIN}
                    max={DATE_MAX}
                    className={`w-full px-4 py-2 bg-background text-foreground border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                      errors.data_cancelamento ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  {errors.data_cancelamento && <p className="mt-1 text-sm text-red-600">{errors.data_cancelamento}</p>}
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
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

            {/* Observações */}
            <div>
              <label htmlFor="observacoes" className="block text-sm font-medium text-foreground mb-2">
                Observações
              </label>
              <textarea
                id="observacoes"
                value={formData.observacoes ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Observações sobre o contrato..."
              />
            </div>
          </div>

          {/* Botões */}
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
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
