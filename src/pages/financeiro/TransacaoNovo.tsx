import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, DollarSign } from 'lucide-react'
import { useCreateTransacao } from '@/hooks/useFinanceiro'
import { transacaoCreateSchema, type TransacaoCreateInput } from '@/lib/validators/financeiro-schema'
import { useClientes } from '@/hooks/useClientes'
import { useServicos } from '@/hooks/usePlanos'
import { useModal } from '@/contexts/ModalContext'

export default function TransacaoNovo() {
  const navigate = useNavigate()
  const { create, loading } = useCreateTransacao()
  const { clientes } = useClientes({ autoFetch: true, limit: 1000 })
  const { servicos } = useServicos(true) // Apenas serviços ativos
  const { alert } = useModal()

  const [formData, setFormData] = useState<TransacaoCreateInput>({
    cliente_id: '',
    servico_id: '',
    tipo: 'receita',
    categoria: '',
    valor: 0,
    moeda: 'BRL',
    descricao: '',
    metodo_pagamento: '',
    status: 'pendente',
    data_vencimento: new Date().toISOString().split('T')[0],
    data_pagamento: '',
    external_transaction_id: '',
    external_source: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      const validated = transacaoCreateSchema.parse({
        ...formData,
        tipo: 'receita',
        servico_id: formData.servico_id || undefined,
        metodo_pagamento: formData.metodo_pagamento || undefined,
        data_pagamento: formData.data_pagamento || undefined,
        external_transaction_id: formData.external_transaction_id || undefined,
        external_source: formData.external_source || undefined,
      })
      await create(validated)
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
        console.error('Erro ao criar transação:', error)
        await alert({
          title: 'Erro',
          message: 'Erro ao criar transação. Tente novamente.',
          variant: 'danger',
        })
      }
    }
  }

  const categoriasComuns = [
    'mensalidade',
    'avulso',
    'plano',
    'servico_avulso',
    'reembolso',
    'outro',
  ]

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
            Nova Transação
          </h1>
          <p className="text-sm text-gray-600 mt-1">Cadastre uma nova transação financeira</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Cliente */}
            <div>
              <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700 mb-2">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                id="cliente_id"
                value={formData.cliente_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, cliente_id: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.cliente_id ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Selecione um cliente...</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
              {errors.cliente_id && <p className="mt-1 text-sm text-red-600">{errors.cliente_id}</p>}
            </div>

            {/* Tipo (fixo: receita) */}
            <input type="hidden" name="tipo" value="receita" />

            {/* Categoria */}
            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-2">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoria: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.categoria ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Selecione uma categoria...</option>
                {categoriasComuns.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
              {errors.categoria && <p className="mt-1 text-sm text-red-600">{errors.categoria}</p>}
            </div>

            {/* Serviço (opcional) */}
            <div>
              <label htmlFor="servico_id" className="block text-sm font-medium text-gray-700 mb-2">
                Serviço (opcional)
              </label>
              <select
                id="servico_id"
                value={formData.servico_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, servico_id: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="">Nenhum serviço</option>
                {servicos.map((servico) => (
                  <option key={servico.id} value={servico.id}>
                    {servico.nome}
                  </option>
                ))}
              </select>
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
                placeholder="0.00"
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
                placeholder="Descreva a transação..."
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
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Salvar Transação
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
