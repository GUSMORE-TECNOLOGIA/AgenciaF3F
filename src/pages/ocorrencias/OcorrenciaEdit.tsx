import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react'
import { useOcorrencia, useUpdateOcorrencia } from '@/hooks/useOcorrencias'
import { useOcorrenciaGrupos, useOcorrenciaTipos } from '@/hooks/useOcorrencias'
import { ocorrenciaUpdateSchema, type OcorrenciaUpdateInput } from '@/lib/validators/ocorrencia-schema'
import { useUsuariosParaSelecaoResponsavel } from '@/hooks/useUsuarios'
import { useModal } from '@/contexts/ModalContext'

export default function OcorrenciaEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { ocorrencia, loading: loadingOcorrencia, refetch } = useOcorrencia(id || null)
  const { update, loading: updating } = useUpdateOcorrencia(id || '')
  const { usuarios } = useUsuariosParaSelecaoResponsavel()
  const { grupos } = useOcorrenciaGrupos()
  const { alert } = useModal()
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>('')
  const { tipos } = useOcorrenciaTipos({ grupoId: selectedGrupoId || undefined })

  const [formData, setFormData] = useState<OcorrenciaUpdateInput>({
    grupo_id: '',
    tipo_id: '',
    ocorreu_em: '',
    notas: '',
    responsavel_id: '',
    prioridade: 'media',
    is_sensitive: false,
    status: 'aberta',
    reminder_at: '',
    reminder_status: 'pendente',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (ocorrencia) {
      const reminderAt = ocorrencia.reminder_at
        ? new Date(ocorrencia.reminder_at).toISOString().slice(0, 16)
        : ''
      setFormData({
        grupo_id: ocorrencia.grupo_id,
        tipo_id: ocorrencia.tipo_id,
        ocorreu_em: ocorrencia.ocorreu_em,
        notas: ocorrencia.notas,
        responsavel_id: ocorrencia.responsavel_id,
        prioridade: ocorrencia.prioridade,
        is_sensitive: ocorrencia.is_sensitive,
        status: ocorrencia.status,
        reminder_at: reminderAt,
        reminder_status: ocorrencia.reminder_status || 'pendente',
      })
      setSelectedGrupoId(ocorrencia.grupo_id)
    }
  }, [ocorrencia])

  useEffect(() => {
    if (selectedGrupoId && selectedGrupoId !== formData.grupo_id) {
      setFormData((prev) => ({ ...prev, grupo_id: selectedGrupoId, tipo_id: '' }))
    }
  }, [selectedGrupoId])

  const selectedTipoNome = tipos.find((t) => t.id === formData.tipo_id)?.nome?.trim().toLowerCase()
  const isCancelamento = selectedTipoNome === 'cancelamento'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (isCancelamento && !(formData.notas ?? '').trim()) {
      setErrors({ notas: 'Motivo/Causa é obrigatório para tipo Cancelamento.' })
      return
    }

    try {
      const validated = ocorrenciaUpdateSchema.parse(formData)
      await update(validated)
      await refetch()
      navigate('/ocorrencias')
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
        console.error('Erro ao atualizar ocorrência:', error)
        await alert({
          title: 'Erro',
          message: 'Erro ao atualizar ocorrência. Tente novamente.',
          variant: 'danger',
        })
      }
    }
  }

  if (loadingOcorrencia) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando dados da ocorrência...</p>
      </div>
    )
  }

  if (!ocorrencia) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Ocorrência não encontrada</p>
        <Link to="/ocorrencias" className="text-primary hover:underline">
          Voltar para ocorrências
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/ocorrencias"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para ocorrências
      </Link>

      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="border-b border-border px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-primary" />
            Editar Ocorrência
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Atualize as informações da ocorrência</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Grupo */}
            <div>
              <label htmlFor="grupo_id" className="block text-sm font-medium text-foreground mb-2">
                Grupo <span className="text-red-500">*</span>
              </label>
              <select
                id="grupo_id"
                value={selectedGrupoId}
                onChange={(e) => {
                  setSelectedGrupoId(e.target.value)
                  setFormData((prev) => ({ ...prev, grupo_id: e.target.value, tipo_id: '' }))
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.grupo_id ? 'border-red-500' : 'border-border'
                }`}
                required
              >
                <option value="">Selecione um grupo...</option>
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </option>
                ))}
              </select>
              {errors.grupo_id && <p className="mt-1 text-sm text-red-600">{errors.grupo_id}</p>}
            </div>

            {/* Tipo */}
            <div>
              <label htmlFor="tipo_id" className="block text-sm font-medium text-foreground mb-2">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                id="tipo_id"
                value={formData.tipo_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, tipo_id: e.target.value }))}
                disabled={!selectedGrupoId}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.tipo_id ? 'border-red-500' : 'border-border'
                } ${!selectedGrupoId ? 'bg-muted cursor-not-allowed' : ''}`}
                required
              >
                <option value="">{selectedGrupoId ? 'Selecione um tipo...' : 'Selecione um grupo primeiro'}</option>
                {tipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
              {errors.tipo_id && <p className="mt-1 text-sm text-red-600">{errors.tipo_id}</p>}
            </div>

            {/* Data */}
            <div>
              <label htmlFor="ocorreu_em" className="block text-sm font-medium text-foreground mb-2">
                Data da Ocorrência <span className="text-red-500">*</span>
              </label>
              <input
                id="ocorreu_em"
                type="date"
                value={formData.ocorreu_em}
                onChange={(e) => setFormData((prev) => ({ ...prev, ocorreu_em: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.ocorreu_em ? 'border-red-500' : 'border-border'
                }`}
                required
              />
              {errors.ocorreu_em && <p className="mt-1 text-sm text-red-600">{errors.ocorreu_em}</p>}
            </div>

            {/* Notas */}
            <div>
              <label htmlFor="notas" className="block text-sm font-medium text-foreground mb-2">
                {isCancelamento ? 'Motivo/Causa (obrigatório)' : 'Notas'} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData((prev) => ({ ...prev, notas: e.target.value }))}
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.notas ? 'border-red-500' : 'border-border'
                }`}
                required
              />
              {errors.notas && <p className="mt-1 text-sm text-red-600">{errors.notas}</p>}
            </div>

            {/* Responsável */}
            <div>
              <label htmlFor="responsavel_id" className="block text-sm font-medium text-foreground mb-2">
                Responsável <span className="text-red-500">*</span>
              </label>
              <select
                id="responsavel_id"
                value={formData.responsavel_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, responsavel_id: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.responsavel_id ? 'border-red-500' : 'border-border'
                }`}
                required
              >
                <option value="">Selecione um responsável...</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.name} ({usuario.email})
                  </option>
                ))}
              </select>
              {errors.responsavel_id && <p className="mt-1 text-sm text-red-600">{errors.responsavel_id}</p>}
            </div>

            {/* Prioridade */}
            <div>
              <label htmlFor="prioridade" className="block text-sm font-medium text-foreground mb-2">
                Prioridade
              </label>
              <select
                id="prioridade"
                value={formData.prioridade}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    prioridade: e.target.value as 'baixa' | 'media' | 'alta' | 'urgente',
                  }))
                }
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as 'aberta' | 'em_andamento' | 'resolvida' | 'cancelada',
                  }))
                }
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="aberta">Aberta</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="resolvida">Resolvida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            {/* Lembrete */}
            <div>
              <label htmlFor="reminder_at" className="block text-sm font-medium text-foreground mb-2">
                Lembrete (opcional)
              </label>
              <input
                id="reminder_at"
                type="datetime-local"
                value={formData.reminder_at || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, reminder_at: e.target.value }))}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="reminder_status" className="block text-sm font-medium text-foreground mb-2">
                Status do lembrete
              </label>
              <select
                id="reminder_status"
                value={formData.reminder_status || 'pendente'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reminder_status: e.target.value as 'pendente' | 'feito' | 'cancelado',
                  }))
                }
                disabled={!formData.reminder_at}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  !formData.reminder_at ? 'bg-muted cursor-not-allowed' : 'border-border'
                }`}
              >
                <option value="pendente">Pendente</option>
                <option value="feito">Feito</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Sensível */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_sensitive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_sensitive: e.target.checked }))}
                  className="w-5 h-5 text-primary border-border rounded focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-foreground">Ocorrência sensível</span>
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-border">
            <Link
              to="/ocorrencias"
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
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
