import { useEffect, useState } from 'react'
import { EquipeMembro, Perfil } from '@/types'
import type { EquipeMembroInput } from '@/services/equipe'

interface EquipeMembroFormProps {
  initialData?: EquipeMembro | null
  /** Lista de perfis para o dropdown (quando definida, substitui o select por slug). */
  perfis?: Perfil[]
  onSubmit: (data: EquipeMembroInput) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export default function EquipeMembroForm({ initialData, perfis = [], onSubmit, onCancel, loading }: EquipeMembroFormProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [perfil, setPerfil] = useState<EquipeMembro['perfil']>('agente')
  const [perfilId, setPerfilId] = useState<string>('')
  const [status, setStatus] = useState<EquipeMembro['status']>('ativo')

  useEffect(() => {
    if (!initialData) return
    setNome(initialData.nome_completo)
    setEmail(initialData.email || '')
    setTelefone(initialData.telefone || '')
    setPerfil(initialData.perfil)
    setStatus(initialData.status)
    if (perfis.length > 0) {
      const pid = (initialData.perfil_id || '').toString().toLowerCase()
      const byId =
        pid && perfis.some((x) => x.id?.toLowerCase() === pid)
          ? perfis.find((x) => x.id?.toLowerCase() === pid)?.id ?? ''
          : perfis.find((x) => x.slug === initialData.perfil)?.id ?? ''
      setPerfilId(byId)
    } else {
      setPerfilId('')
    }
  }, [initialData, perfis])

  useEffect(() => {
    if (perfis.length > 0 && !perfilId && !initialData && perfis[0]) setPerfilId(perfis[0].id)
  }, [perfis, perfilId, initialData])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const slugRaw = perfis.length > 0 ? (perfis.find((p) => p.id === perfilId)?.slug ?? 'agente') : perfil
    const slug: EquipeMembro['perfil'] =
      slugRaw === 'admin' || slugRaw === 'gerente' || slugRaw === 'agente' || slugRaw === 'suporte' || slugRaw === 'financeiro'
        ? slugRaw
        : 'agente'
    await onSubmit({
      nome_completo: nome.trim(),
      email: email.trim() || undefined,
      telefone: telefone.trim() || undefined,
      perfil: slug,
      perfil_id: perfis.length > 0 ? perfilId || null : undefined,
      status,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {initialData ? 'Editar membro' : 'Novo membro'}
        </h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            Cancelar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Nome completo</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Nome do membro"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="email@empresa.com"
            required={!initialData}
          />
          {!initialData && (
            <p className="mt-1 text-xs text-muted-foreground">
              Será criado usuário de acesso com senha padrão 123456. O membro precisará alterar no primeiro login.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Telefone</label>
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="(00) 00000-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Perfil</label>
          {perfis.length > 0 ? (
            <select
              value={perfilId}
              onChange={(e) => setPerfilId(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            >
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value as EquipeMembro['perfil'])}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="admin">Admin</option>
              <option value="gerente">Gerente</option>
              <option value="agente">Agente</option>
              <option value="suporte">Suporte</option>
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EquipeMembro['status'])}
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
          >
            Voltar
          </button>
        )}
      </div>
    </form>
  )
}
