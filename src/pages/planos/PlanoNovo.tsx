import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useCreatePlano } from '@/hooks/usePlanos'
import { planoCreateSchema, type PlanoCreateInput } from '@/lib/validators/plano-schema'
import { useModal } from '@/contexts/ModalContext'

export default function PlanoNovo() {
  const navigate = useNavigate()
  const { create, loading } = useCreatePlano()
  const { alert } = useModal()

  const [formData, setFormData] = useState<PlanoCreateInput>({
    nome: '',
    descricao: '',
    valor: 0,
    moeda: 'BRL',
    ativo: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      const validated = planoCreateSchema.parse(formData)
      await create(validated)
      navigate('/planos')
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
        console.error('Erro ao criar plano:', error)
        await alert({
          title: 'Erro',
          message: 'Erro ao criar plano. Tente novamente.',
          variant: 'danger',
        })
      }
    }
  }

  return (
    <div>
      <Link
        to="/planos"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para planos
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Novo Plano</h1>
          <p className="text-sm text-gray-600 mt-1">Cadastre um novo plano (pacote de serviços)</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Plano <span className="text-red-500">*</span>
              </label>
              <input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.nome ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Plano Fase 1, Plano Funil, Plano L.T..."
                required
              />
              {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Descreva o plano e seus benefícios..."
              />
            </div>

            {/* Valor */}
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-2">
                Valor do Plano (R$) <span className="text-red-500">*</span>
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
                placeholder="0.00"
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

            {/* Status Ativo */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ativo: e.target.checked }))}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-gray-700">Plano ativo</span>
              </label>
              <p className="mt-1 text-xs text-gray-500 ml-8">
                Planos inativos não aparecerão nas opções de seleção
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <Link
              to="/planos"
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
              Salvar Plano
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
