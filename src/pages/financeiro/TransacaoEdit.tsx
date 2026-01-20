import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, DollarSign } from 'lucide-react'
import { useTransacao, useUpdateTransacao } from '@/hooks/useFinanceiro'
import { transacaoUpdateSchema, type TransacaoUpdateInput } from '@/lib/validators/financeiro-schema'
import { useClientes } from '@/hooks/useClientes'

export default function TransacaoEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { clientes } = useClientes({ autoFetch: true, limit: 1000 })
  const { transacao, loading: loadingTransacao, refetch } = useTransacao(id || null)

  const [formData, setFormData] = useState<TransacaoUpdateInput>({
    valor: 0,
    descricao: '',
    status: 'pendente',
    data_vencimento: '',
    data_pagamento: '',
    metodo_pagamento: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (transacao) {
      setFormData({
        valor: transacao.valor,
        descricao: transacao.descricao,
        status: transacao.status,
        data_vencimento: transacao.data_vencimento,
        data_pagamento: transacao.data_pagamento || '',
        metodo_pagamento: transacao.metodo_pagamento || '',
      })
    }
  }, [transacao])

  const { update, loading: updating } = useUpdateTransacao()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    setErrors({})

    try {
      const validated = transacaoUpdateSchema.parse({
        ...formData,
        data_pagamento: formData.data_pagamento || undefined,
        metodo_pagamento: formData.metodo_pagamento || undefined,
      })
      await update(id!, validated)
      await refetch()
      navigate('/financeiro')
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
        console.error('Erro ao atualizar transação:', error)
        alert('Erro ao atualizar transação. Tente novamente.')
      }
    }
  }

  if (loadingTransacao) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-500">Carregando dados da transação...</p>
      </div>
    )
  }

  if (!transacao) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Transação não encontrada</p>
        <Link to="/financeiro" className="text-primary hover:underline">
          Voltar para financeiro
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/financeiro"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para financeiro
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Editar Transação
          </h1>
          <p className="text-sm text-gray-600 mt-1">Atualize as informações da transação</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Cliente (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
              <input
                type="text"
                value={clientes.find((c) => c.id === transacao.cliente_id)?.nome || 'Cliente não encontrado'}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            {/* Tipo (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <input
                type="text"
                value={transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            {/* Valor */}
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valor}
                onChange={(e) => setFormData((prev) => ({ ...prev, valor: Number(e.target.value) }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.valor ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.valor && <p className="mt-1 text-sm text-red-600">{errors.valor}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.descricao ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.descricao && <p className="mt-1 text-sm text-red-600">{errors.descricao}</p>}
            </div>

            {/* Data de Vencimento */}
            <div>
              <label htmlFor="data_vencimento" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Vencimento <span className="text-red-500">*</span>
              </label>
              <input
                id="data_vencimento"
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => setFormData((prev) => ({ ...prev, data_vencimento: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.data_vencimento ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.data_vencimento && <p className="mt-1 text-sm text-red-600">{errors.data_vencimento}</p>}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado',
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
                <option value="cancelado">Cancelado</option>
                <option value="reembolsado">Reembolsado</option>
              </select>
            </div>

            {/* Método de Pagamento */}
            {formData.status === 'pago' && (
              <div>
                <label htmlFor="metodo_pagamento" className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pagamento
                </label>
                <select
                  id="metodo_pagamento"
                  value={formData.metodo_pagamento}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metodo_pagamento: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                  <option value="">Selecione...</option>
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Transferência">Transferência Bancária</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>
            )}

            {/* Data de Pagamento */}
            {formData.status === 'pago' && (
              <div>
                <label htmlFor="data_pagamento" className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Pagamento
                </label>
                <input
                  id="data_pagamento"
                  type="date"
                  value={formData.data_pagamento}
                  onChange={(e) => setFormData((prev) => ({ ...prev, data_pagamento: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <Link
              to="/financeiro"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
