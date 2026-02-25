import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, MessageSquare } from 'lucide-react'
import { useAtendimento, useUpdateAtendimento } from '@/hooks/useAtendimentos'
import { atendimentoUpdateSchema, type AtendimentoUpdateInput } from '@/lib/validators/atendimento-schema'
import { useUsuarios } from '@/hooks/useUsuarios'
import { useModal } from '@/contexts/ModalContext'

export default function AtendimentoEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { atendimento, loading: loadingAtendimento, refetch } = useAtendimento(id || null)
  const { update, loading: updating } = useUpdateAtendimento(id || '')
  const { usuarios } = useUsuarios()
  const { alert } = useModal()

  const [formData, setFormData] = useState<AtendimentoUpdateInput>({
    tipo: 'email',
    assunto: '',
    descricao: '',
    data_atendimento: '',
    duracao_minutos: undefined,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Formatar data/hora para input datetime-local
  const formatDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Converter datetime-local para ISO
  const parseDateTimeLocal = (localString: string) => {
    return new Date(localString).toISOString()
  }

  useEffect(() => {
    if (atendimento) {
      setFormData({
        tipo: atendimento.tipo,
        assunto: atendimento.assunto,
        descricao: atendimento.descricao,
        data_atendimento: atendimento.data_atendimento,
        duracao_minutos: atendimento.duracao_minutos,
      })
    }
  }, [atendimento])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      const { duracao_minutos, ...rest } = formData
      const duracaoFinal: number | undefined = duracao_minutos === null ? undefined : duracao_minutos
      const dataToValidate = {
        ...rest,
        data_atendimento: formData.data_atendimento || undefined,
        duracao_minutos: duracaoFinal,
      } as AtendimentoUpdateInput
      const validated = atendimentoUpdateSchema.parse(dataToValidate) as AtendimentoUpdateInput
      await update(validated)
      await refetch()
      navigate('/atendimento')
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
        console.error('Erro ao atualizar atendimento:', error)
        await alert({
          title: 'Erro',
          message: 'Erro ao atualizar atendimento. Tente novamente.',
          variant: 'danger',
        })
      }
    }
  }

  if (loadingAtendimento) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando dados do atendimento...</p>
      </div>
    )
  }

  if (!atendimento) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Atendimento não encontrado</p>
        <Link to="/atendimento" className="text-primary hover:underline">
          Voltar para atendimento
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/atendimento"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para atendimento
      </Link>

      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="border-b border-border px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Editar Atendimento
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Atualize as informações do atendimento</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Cliente (readonly) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Cliente</label>
              <input
                type="text"
                value="Cliente (não edit?vel)"
                disabled
                className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
              />
            </div>

            {/* Usuário (readonly) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Atendente</label>
              <input
                type="text"
                value={usuarios.find((u) => u.id === atendimento.usuario_id)?.name || 'Usuário não encontrado'}
                disabled
                className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
              />
            </div>

            {/* Tipo */}
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-foreground mb-2">
                Tipo de Atendimento <span className="text-red-500">*</span>
              </label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tipo: e.target.value as 'email' | 'whatsapp' | 'telefone' | 'presencial',
                  }))
                }
                className={`w-full px-4 py-2 bg-background text-foreground border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.tipo ? 'border-red-500' : 'border-border'
                }`}
                required
              >
                <option value="email">?? Email</option>
                <option value="whatsapp">?? WhatsApp</option>
                <option value="telefone">?? Telefone</option>
                <option value="presencial">?? Presencial</option>
              </select>
              {errors.tipo && <p className="mt-1 text-sm text-red-600">{errors.tipo}</p>}
            </div>

            {/* Assunto */}
            <div>
              <label htmlFor="assunto" className="block text-sm font-medium text-foreground mb-2">
                Assunto <span className="text-red-500">*</span>
              </label>
              <input
                id="assunto"
                type="text"
                value={formData.assunto}
                onChange={(e) => setFormData((prev) => ({ ...prev, assunto: e.target.value }))}
                className={`w-full px-4 py-2 bg-background text-foreground border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.assunto ? 'border-red-500' : 'border-border'
                }`}
                required
              />
              {errors.assunto && <p className="mt-1 text-sm text-red-600">{errors.assunto}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-foreground mb-2">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                rows={6}
                className={`w-full px-4 py-2 bg-background text-foreground border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.descricao ? 'border-red-500' : 'border-border'
                }`}
                required
              />
              {errors.descricao && <p className="mt-1 text-sm text-red-600">{errors.descricao}</p>}
            </div>

            {/* Data/Hora do Atendimento */}
            <div>
              <label htmlFor="data_atendimento" className="block text-sm font-medium text-foreground mb-2">
                Data e Hora do Atendimento <span className="text-red-500">*</span>
              </label>
              <input
                id="data_atendimento"
                type="datetime-local"
                value={formData.data_atendimento ? formatDateTimeLocal(formData.data_atendimento) : ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    data_atendimento: parseDateTimeLocal(e.target.value),
                  }))
                }
                className={`w-full px-4 py-2 bg-background text-foreground border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.data_atendimento ? 'border-red-500' : 'border-border'
                }`}
                required
              />
              {errors.data_atendimento && <p className="mt-1 text-sm text-red-600">{errors.data_atendimento}</p>}
            </div>

            {/* Duração */}
            <div>
              <label htmlFor="duracao_minutos" className="block text-sm font-medium text-foreground mb-2">
                Duração (minutos)
              </label>
              <input
                id="duracao_minutos"
                type="number"
                min="0"
                step="1"
                value={formData.duracao_minutos || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    duracao_minutos: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Ex: 30"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-border">
            <Link
              to="/atendimento"
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
