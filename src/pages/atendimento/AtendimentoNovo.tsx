import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, MessageSquare } from 'lucide-react'
import { useCreateAtendimento } from '@/hooks/useAtendimentos'
import { atendimentoCreateSchema, type AtendimentoCreateInput } from '@/lib/validators/atendimento-schema'
import { useClientes } from '@/hooks/useClientes'
import { useUsuarios } from '@/hooks/useUsuarios'
import { useAuth } from '@/contexts/AuthContext'

export default function AtendimentoNovo() {
  const navigate = useNavigate()
  const { create, loading } = useCreateAtendimento()
  const { clientes } = useClientes({ autoFetch: true, limit: 1000 })
  const { usuarios } = useUsuarios()
  const { user } = useAuth()

  const [formData, setFormData] = useState<AtendimentoCreateInput>({
    cliente_id: '',
    usuario_id: user?.id || '',
    tipo: 'email',
    assunto: '',
    descricao: '',
    data_atendimento: new Date().toISOString(),
    duracao_minutos: undefined,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      const { duracao_minutos, ...rest } = formData
      const duracaoFinal: number | undefined = duracao_minutos === null ? undefined : duracao_minutos
      const dataToValidate = {
        ...rest,
        duracao_minutos: duracaoFinal,
      }
      const validated = atendimentoCreateSchema.parse(dataToValidate)
      await create(validated)
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
        console.error('Erro ao criar atendimento:', error)
        alert('Erro ao criar atendimento. Tente novamente.')
      }
    }
  }

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

  return (
    <div>
      <Link
        to="/atendimento"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para atendimento
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Novo Atendimento
          </h1>
          <p className="text-sm text-gray-600 mt-1">Registre um novo atendimento ao cliente</p>
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

            {/* Usuário */}
            <div>
              <label htmlFor="usuario_id" className="block text-sm font-medium text-gray-700 mb-2">
                Atendente <span className="text-red-500">*</span>
              </label>
              <select
                id="usuario_id"
                value={formData.usuario_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, usuario_id: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.usuario_id ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Selecione um atendente...</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.name} ({usuario.email})
                  </option>
                ))}
              </select>
              {errors.usuario_id && <p className="mt-1 text-sm text-red-600">{errors.usuario_id}</p>}
            </div>

            {/* Tipo */}
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
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
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.tipo ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="email">📧 Email</option>
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="telefone">📞 Telefone</option>
                <option value="presencial">👤 Presencial</option>
              </select>
              {errors.tipo && <p className="mt-1 text-sm text-red-600">{errors.tipo}</p>}
            </div>

            {/* Assunto */}
            <div>
              <label htmlFor="assunto" className="block text-sm font-medium text-gray-700 mb-2">
                Assunto <span className="text-red-500">*</span>
              </label>
              <input
                id="assunto"
                type="text"
                value={formData.assunto}
                onChange={(e) => setFormData((prev) => ({ ...prev, assunto: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.assunto ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Dúvida sobre serviço, Solicitação de alteração..."
                required
              />
              {errors.assunto && <p className="mt-1 text-sm text-red-600">{errors.assunto}</p>}
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
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.descricao ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Descreva o atendimento em detalhes..."
                required
              />
              {errors.descricao && <p className="mt-1 text-sm text-red-600">{errors.descricao}</p>}
            </div>

            {/* Data/Hora do Atendimento */}
            <div>
              <label htmlFor="data_atendimento" className="block text-sm font-medium text-gray-700 mb-2">
                Data e Hora do Atendimento <span className="text-red-500">*</span>
              </label>
              <input
                id="data_atendimento"
                type="datetime-local"
                value={formatDateTimeLocal(formData.data_atendimento)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    data_atendimento: parseDateTimeLocal(e.target.value),
                  }))
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.data_atendimento ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.data_atendimento && <p className="mt-1 text-sm text-red-600">{errors.data_atendimento}</p>}
            </div>

            {/* Duração */}
            <div>
              <label htmlFor="duracao_minutos" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Ex: 30"
              />
              <p className="mt-1 text-xs text-gray-500">Tempo de duração do atendimento em minutos</p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <Link
              to="/atendimento"
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
              Salvar Atendimento
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
