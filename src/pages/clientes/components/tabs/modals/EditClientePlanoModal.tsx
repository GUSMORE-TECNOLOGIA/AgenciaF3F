import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { ClientePlano } from '@/types'
import { useUpdateClientePlano } from '@/hooks/usePlanos'
import { clientePlanoUpdateSchema, type ClientePlanoUpdateInput } from '@/lib/validators/plano-schema'
import { useModal } from '@/contexts/ModalContext'

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
  const [formData, setFormData] = useState<ClientePlanoUpdateInput>({
    valor: contrato.valor,
    moeda: contrato.moeda,
    status: contrato.status,
    observacoes: contrato.observacoes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && contrato) {
      setFormData({
        valor: contrato.valor,
        moeda: contrato.moeda,
        status: contrato.status,
        observacoes: contrato.observacoes || '',
      })
      setErrors({})
    }
  }, [isOpen, contrato])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      const validated = clientePlanoUpdateSchema.parse(formData)
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Editar Contrato de Plano</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Informações do Plano */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Plano</div>
              <div className="text-lg font-semibold text-foreground">
                {contrato.plano?.nome || 'Plano não encontrado'}
              </div>
              {contrato.plano && (
                <div className="text-sm text-gray-600 mt-1">
                  Valor original: R$ {contrato.plano.valor.toFixed(2).replace('.', ',')}
                </div>
              )}
            </div>

            {/* Valor */}
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-2">
                Valor do Contrato (R$) <span className="text-red-500">*</span>
              </label>
              <input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, valor: Number(e.target.value) }))
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.valor ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.valor && <p className="mt-1 text-sm text-red-600">{errors.valor}</p>}
            </div>

            {/* Moeda */}
            <div>
              <label htmlFor="moeda" className="block text-sm font-medium text-gray-700 mb-2">
                Moeda
              </label>
              <select
                id="moeda"
                value={formData.moeda}
                onChange={(e) => setFormData((prev) => ({ ...prev, moeda: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="BRL">BRL - Real Brasileiro</option>
                <option value="USD">USD - Dólar Americano</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
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
              <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                id="observacoes"
                value={formData.observacoes ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Observações sobre o contrato..."
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
