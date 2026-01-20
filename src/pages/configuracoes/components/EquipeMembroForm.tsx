import { useEffect, useState } from 'react'
import { EquipeMembro } from '@/types'
import type { EquipeMembroInput } from '@/services/equipe'

interface EquipeMembroFormProps {
  initialData?: EquipeMembro | null
  onSubmit: (data: EquipeMembroInput) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export default function EquipeMembroForm({ initialData, onSubmit, onCancel, loading }: EquipeMembroFormProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cargo, setCargo] = useState<EquipeMembro['cargo']>('agente')
  const [status, setStatus] = useState<EquipeMembro['status']>('ativo')

  useEffect(() => {
    if (!initialData) return
    setNome(initialData.nome_completo)
    setEmail(initialData.email || '')
    setTelefone(initialData.telefone || '')
    setCargo(initialData.cargo)
    setStatus(initialData.status)
  }, [initialData])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await onSubmit({
      nome_completo: nome.trim(),
      email: email.trim() || undefined,
      telefone: telefone.trim() || undefined,
      cargo,
      status,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {initialData ? 'Editar membro' : 'Novo membro'}
        </h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-gray-600 hover:text-gray-900">
            Cancelar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Nome do membro"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="email@empresa.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="(00) 00000-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
          <select
            value={cargo}
            onChange={(e) => setCargo(e.target.value as EquipeMembro['cargo'])}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="admin">Admin</option>
            <option value="gerente">Gerente</option>
            <option value="agente">Agente</option>
            <option value="suporte">Suporte</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EquipeMembro['status'])}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : initialData ? 'Salvar alterações' : 'Criar membro'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Voltar
          </button>
        )}
      </div>
    </form>
  )
}
