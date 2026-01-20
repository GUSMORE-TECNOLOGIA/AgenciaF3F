import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useServico, useUpdateServico } from '@/hooks/usePlanos'
import { servicoUpdateSchema, type ServicoUpdateInput } from '@/lib/validators/plano-schema'

export default function ServicoEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { servico, loading: loadingServico, refetch } = useServico(id || null)
  const { update, loading: updating } = useUpdateServico(id || '')

  const [formData, setFormData] = useState<ServicoUpdateInput>({
    nome: '',
    descricao: '',
    valor: undefined,
    ativo: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (servico) {
      setFormData({
        nome: servico.nome,
        descricao: servico.descricao || '',
        valor: servico.valor,
        ativo: servico.ativo,
      })
    }
  }, [servico])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      const validated = servicoUpdateSchema.parse(formData)
      await update(validated)
      await refetch()
      navigate('/servicos')
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
        console.error('Erro ao atualizar serviço:', error)
        alert('Erro ao atualizar serviço. Tente novamente.')
      }
    }
  }

  if (loadingServico) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-500">Carregando dados do serviço...</p>
      </div>
    )
  }

  if (!servico) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Serviço não encontrado</p>
        <Link to="/servicos" className="text-primary hover:underline">
          Voltar para lista de serviços
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/servicos"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para serviços
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Editar Serviço</h1>
          <p className="text-sm text-gray-600 mt-1">Atualize as informações do serviço</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Serviço <span className="text-red-500">*</span>
              </label>
              <input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.nome ? 'border-red-500' : 'border-gray-300'
                }`}
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
              />
            </div>

            {/* Valor */}
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-2">
                Valor Individual (R$)
              </label>
              <input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    valor: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.valor ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.valor && <p className="mt-1 text-sm text-red-600">{errors.valor}</p>}
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
                <span className="text-sm font-medium text-gray-700">Serviço ativo</span>
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <Link
              to="/servicos"
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
