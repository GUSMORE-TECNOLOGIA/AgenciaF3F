import { useState, useEffect } from 'react'
import { Cliente } from '@/types'
import { useUpdateCliente } from '@/hooks/useCliente'
import { ClienteUpdateInput } from '@/lib/validators/cliente-schema'
import ClienteLogoUpload from '../ClienteLogoUpload'
import { Save, Loader2, User2, Image, Settings, Calendar } from 'lucide-react'
import { useModal } from '@/contexts/ModalContext'

interface IdentificacaoTabProps {
  cliente: Cliente
  onSave?: () => void
}

export default function IdentificacaoTab({ cliente, onSave }: IdentificacaoTabProps) {
  const { update, loading } = useUpdateCliente(cliente.id)
  const [saving, setSaving] = useState(false)
  const { alert } = useModal()

  const [formData, setFormData] = useState({
    nome: cliente.nome,
    email: cliente.email || '',
    telefone: cliente.telefone || '',
    status: cliente.status,
  })

  useEffect(() => {
    setFormData({
      nome: cliente.nome,
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      status: cliente.status,
    })
  }, [cliente.id, cliente.nome, cliente.email, cliente.telefone, cliente.status])

  const handleSave = async () => {
    try {
      setSaving(true)
      const updateData: ClienteUpdateInput = {
        nome: formData.nome,
        email: formData.email || undefined,
        telefone: formData.telefone || undefined,
        status: formData.status,
      }
      await update(updateData)
      if (onSave) onSave()
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
      await alert({
        title: 'Erro',
        message: 'Erro ao salvar dados. Tente novamente.',
        variant: 'danger',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (url: string) => {
    try {
      await update({ logo_url: url })
      if (onSave) onSave()
    } catch (error) {
      console.error('Erro ao salvar logo:', error)
      throw error
    }
  }

  const handleLogoRemove = async () => {
    try {
      await update({ logo_url: null })
      if (onSave) onSave()
    } catch (error) {
      console.error('Erro ao remover logo:', error)
      throw error
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Dados Pessoais - Coluna Esquerda (2/3) */}
      <div className="lg:col-span-2">
        <div className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="border-b border-border px-6 py-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <User2 className="h-5 w-5 text-primary" />
              Dados Pessoais
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-foreground mb-2">
                  Nome do Cliente <span className="text-red-500">*</span>
                </label>
                <input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  className="w-full h-9 px-3 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full h-9 px-3 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-foreground mb-2">
                  Telefone
                </label>
                <input
                  id="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, telefone: e.target.value }))}
                  className="w-full h-9 px-3 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value as 'ativo' | 'inativo' | 'pausado' }))
                  }
                  className="w-full h-9 px-3 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                >
                  <option value="ativo">Ativo</option>
                  <option value="pausado">Pausado</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 px-4 py-2 h-9 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(saving || loading) && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logo e Sistema - Coluna Direita (1/3) */}
      <div className="space-y-6">
        {/* Logo do Cliente */}
        <div className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="border-b border-border px-6 py-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Logo do Cliente
            </h2>
          </div>
          <div className="p-6">
            <ClienteLogoUpload
              logoUrl={cliente.logo_url}
              onUpload={handleLogoUpload}
              onRemove={handleLogoRemove}
              clienteId={cliente.id}
              clienteNome={cliente.nome}
            />
          </div>
        </div>

        {/* Informações do Sistema */}
        <div className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="border-b border-border px-6 py-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Sistema
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Criado em{' '}
                {cliente.created_at
                  ? new Date(cliente.created_at).toLocaleDateString('pt-BR')
                  : 'Data não disponível'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User2 className="h-4 w-4" />
              <span>ID: {cliente.id ? cliente.id.slice(0, 8) + '...' : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
