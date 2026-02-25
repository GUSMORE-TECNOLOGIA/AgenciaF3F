import { useState, useEffect } from 'react'
import { Cliente } from '@/types'
import { clienteCreateSchema, clienteUpdateSchema, type ClienteCreateInput, type ClienteUpdateInput } from '@/lib/validators/cliente-schema'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ClienteFormProps {
  mode: 'create' | 'edit'
  initialData?: Cliente
  onSubmit: (data: ClienteCreateInput | ClienteUpdateInput) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export default function ClienteForm({ mode, initialData, onSubmit, onCancel, loading: externalLoading }: ClienteFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Estados do formulário
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [status, setStatus] = useState<'ativo' | 'inativo' | 'pausado'>('ativo')

  // Inicializar com dados existentes (modo edição)
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setNome(initialData.nome)
      setEmail(initialData.email || '')
      setTelefone(initialData.telefone || '')
      setStatus(initialData.status)
    }
  }, [mode, initialData])

  const validateField = (field: string, value: any): string | null => {
    try {
      if (mode === 'create') {
        const schema = clienteCreateSchema.pick({ [field]: true } as any)
        schema.parse({ [field]: value })
      } else {
        const schema = clienteUpdateSchema.pick({ [field]: true } as any)
        schema.parse({ [field]: value })
      }
      return null
    } catch (error: any) {
      if (error.errors && error.errors[0]) {
        return error.errors[0].message
      }
      return 'Valor inválido'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      setLoading(true)

      // Preparar dados
      const formData: any = {
        nome,
        email: email || undefined,
        telefone: telefone || undefined,
        responsavel_id: user?.id || '',
        status,
      }

      // Validar
      if (mode === 'create') {
        await clienteCreateSchema.parseAsync(formData)
        await onSubmit(formData as ClienteCreateInput)
      } else {
        await clienteUpdateSchema.parseAsync(formData)
        await onSubmit(formData as ClienteUpdateInput)
      }
    } catch (error: any) {
      if (error.errors) {
        // Erros de validação Zod
        const zodErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            zodErrors[err.path[0]] = err.message
          }
        })
        setErrors(zodErrors)
      } else {
        console.error('Erro ao salvar cliente:', error)
        setErrors({ submit: error.message || 'Erro ao salvar cliente' })
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = nome.length >= 2 && user?.id

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome */}
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-foreground mb-2">
          Nome do Cliente <span className="text-red-500">*</span>
        </label>
        <input
          id="nome"
          type="text"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            if (errors.nome) {
              const error = validateField('nome', e.target.value)
              if (error) {
                setErrors((prev) => ({ ...prev, nome: error }))
              } else {
                setErrors((prev) => {
                  const newErrors = { ...prev }
                  delete newErrors.nome
                  return newErrors
                })
              }
            }
          }}
          onBlur={() => {
            const error = validateField('nome', nome)
            if (error) {
              setErrors((prev) => ({ ...prev, nome: error }))
            }
          }}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
            errors.nome ? 'border-red-500' : 'border-border'
          }`}
          placeholder="Nome completo do cliente"
          required
        />
        {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) {
              const error = validateField('email', e.target.value || '')
              if (error) {
                setErrors((prev) => ({ ...prev, email: error }))
              } else {
                setErrors((prev) => {
                  const newErrors = { ...prev }
                  delete newErrors.email
                  return newErrors
                })
              }
            }
          }}
          onBlur={() => {
            if (email) {
              const error = validateField('email', email)
              if (error) {
                setErrors((prev) => ({ ...prev, email: error }))
              }
            }
          }}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
            errors.email ? 'border-red-500' : 'border-border'
          }`}
          placeholder="email@exemplo.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      {/* Telefone */}
      <div>
        <label htmlFor="telefone" className="block text-sm font-medium text-foreground mb-2">
          Telefone
        </label>
        <input
          id="telefone"
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="(11) 99999-9999"
        />
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo' | 'pausado')}
          className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        >
          <option value="ativo">Ativo</option>
          <option value="pausado">Pausado</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      {/* Erro geral */}
      {errors.submit && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading || externalLoading}
            className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={!isFormValid || loading || externalLoading}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {(loading || externalLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'create' ? 'Criar Cliente' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  )
}
