import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { usePlano, useUpdatePlano } from '@/hooks/usePlanos'
import { planoUpdateSchema, type PlanoUpdateInput } from '@/lib/validators/plano-schema'
import { useModal } from '@/contexts/ModalContext'
import InputMoeda from '@/components/ui/InputMoeda'

export default function PlanoEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { plano, loading: loadingPlano, refetch } = usePlano(id || null)
  const { update, loading: updating } = useUpdatePlano(id || '')
  const { alert } = useModal()

  const [formData, setFormData] = useState<PlanoUpdateInput>({
    nome: '',
    descricao: '',
    valor: 0,
    moeda: 'BRL',
    ativo: true,
    recorrencia_meses: 12,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (plano) {
      setFormData({
        nome: plano.nome,
        descricao: plano.descricao || '',
        valor: plano.valor,
        moeda: plano.moeda,
        ativo: plano.ativo,
        recorrencia_meses: plano.recorrencia_meses ?? 12,
      })
    }
  }, [plano])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      const validated = planoUpdateSchema.parse(formData)
      await update(validated)
      await refetch()
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
        console.error('Erro ao atualizar plano:', error)
        await alert({
          title: 'Erro',
          message: 'Erro ao atualizar plano. Tente novamente.',
          variant: 'danger',
        })
      }
    }
  }

  if (loadingPlano) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando dados do plano...</p>
      </div>
    )
  }

  if (!plano) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Plano não encontrado</p>
        <Link to="/planos" className="text-primary hover:underline">
          Voltar para lista de planos
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/planos"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para planos
      </Link>

      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="border-b border-border px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Editar Plano</h1>
          <p className="text-sm text-muted-foreground mt-1">Atualize as informações do plano</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-foreground mb-2">
                Nome do Plano <span className="text-red-500">*</span>
              </label>
              <input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                className={`w-full px-4 py-2 bg-background text-foreground border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.nome ? 'border-red-500' : 'border-border'
                }`}
                required
              />
              {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-foreground mb-2">
                Descrição
              </label>
              <textarea
                id="descricao"
                value={formData.descricao ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            {/* Valor | Moeda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="valor" className="block text-sm font-medium text-foreground mb-2">
                  Valor do Plano (R$) <span className="text-red-500">*</span>
                </label>
                <InputMoeda
                  id="valor"
                  value={formData.valor ?? ''}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, valor: v ?? 0 }))}
                  className={`w-full px-4 py-2 bg-background text-foreground border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                    errors.valor ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="0,00"
                  aria-invalid={!!errors.valor}
                  aria-describedby={errors.valor ? 'valor-error-edit' : undefined}
                />
                {errors.valor && <p id="valor-error-edit" className="mt-1 text-sm text-red-600">{errors.valor}</p>}
              </div>
              <div>
                <label htmlFor="moeda" className="block text-sm font-medium text-foreground mb-2">
                  Moeda
                </label>
                <select
                  id="moeda"
                  value={formData.moeda}
                  onChange={(e) => setFormData((prev) => ({ ...prev, moeda: e.target.value }))}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                  <option value="BRL">BRL - Real Brasileiro</option>
                  <option value="USD">USD - Dólar Americano</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
            </div>

            {/* Recorrência (meses) | Plano ativo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="recorrencia_meses" className="block text-sm font-medium text-foreground mb-2">
                  Recorrência (meses)
                </label>
                <input
                  id="recorrencia_meses"
                  type="number"
                  min={1}
                  max={99}
                  value={formData.recorrencia_meses ?? 12}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, recorrencia_meses: Number(e.target.value) || 12 }))
                  }
                  className={`w-full px-4 py-2 bg-background text-foreground border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                    errors.recorrencia_meses ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="12"
                />
                {errors.recorrencia_meses && (
                  <p className="mt-1 text-sm text-red-600">{errors.recorrencia_meses}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">De 1 a 99 meses</p>
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ativo: e.target.checked }))}
                    className="w-5 h-5 text-primary border-border rounded focus:ring-primary/20"
                  />
                  <span className="text-sm font-medium text-foreground">Plano ativo</span>
                </label>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-border">
            <Link
              to="/planos"
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
