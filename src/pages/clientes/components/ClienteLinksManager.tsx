import { useState, useEffect } from 'react'
import { ClienteLink } from '@/types'
import { useClienteLinks } from '@/hooks/useClienteLinks'
import { ExternalLink, Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react'
import { useModal } from '@/contexts/ModalContext'

interface ClienteLinksManagerProps {
  clienteId: string
  onSave?: () => void
}

// Tipos de links sugeridos (podem ser customizados)
const tiposSugeridos = [
  'Google Drive',
  'Instagram',
  'Facebook',
  'Conta de Anúncio - F3F',
  'Conta de Anúncio - L.T',
  'Business Suite',
  'Dashboard',
  'Planilha de Dados',
  'UTMify',
  'WordPress',
  'Página de Vendas - L.T',
  'Checkout',
  'Google Ads',
  'Meta Ads',
  'TikTok Ads',
  'LinkedIn',
  'YouTube',
  'WhatsApp Business',
  'Outro',
]

export default function ClienteLinksManager({ clienteId, onSave }: ClienteLinksManagerProps) {
  const { links, loading, loadLinks, create, update, remove } = useClienteLinks(clienteId)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    url: '',
    tipo: '',
    pessoa: '',
    status: 'ativo' as 'ativo' | 'inativo',
  })
  const { confirm, alert } = useModal()

  useEffect(() => {
    loadLinks()
  }, [loadLinks])

  const handleAdd = () => {
    setIsAdding(true)
    setFormData({
      url: '',
      tipo: '',
      pessoa: '',
      status: 'ativo',
    })
  }

  const handleEdit = (link: ClienteLink) => {
    setEditingId(link.id)
    setFormData({
      url: link.url,
      tipo: link.tipo,
      pessoa: link.pessoa || '',
      status: link.status,
    })
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      url: '',
      tipo: '',
      pessoa: '',
      status: 'ativo',
    })
  }

  const handleSave = async () => {
    try {
      if (!formData.url.trim()) {
        await alert({ message: 'URL é obrigatória' })
        return
      }

      if (!formData.tipo.trim()) {
        await alert({ message: 'Tipo/Classificação é obrigatória' })
        return
      }

      // Validar URL
      try {
        new URL(formData.url.trim())
      } catch {
        await alert({ message: 'URL inválida' })
        return
      }

      if (isAdding) {
        await create({
          url: formData.url.trim(),
          tipo: formData.tipo.trim(),
          pessoa: formData.pessoa.trim() || undefined,
          status: formData.status,
        })
        setIsAdding(false)
      } else if (editingId) {
        await update(editingId, {
          url: formData.url.trim(),
          tipo: formData.tipo.trim(),
          pessoa: formData.pessoa.trim() || undefined,
          status: formData.status,
        })
        setEditingId(null)
      }

      setFormData({
        url: '',
        tipo: '',
        pessoa: '',
        status: 'ativo',
      })

      if (onSave) onSave()
    } catch (error) {
      console.error('Erro ao salvar link:', error)
    }
  }

  const handleDelete = async (link: ClienteLink) => {
    const confirmed = await confirm({
      message: `Deseja realmente excluir este link?\n\nTipo: ${link.tipo}\nURL: ${link.url}`,
      variant: 'danger',
    })
    if (confirmed) {
      try {
        await remove(link.id)
        if (onSave) onSave()
      } catch (error) {
        console.error('Erro ao deletar link:', error)
      }
    }
  }

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Agrupar links por tipo
  const linksPorTipo = links.reduce((acc, link) => {
    if (!acc[link.tipo]) {
      acc[link.tipo] = []
    }
    acc[link.tipo].push(link)
    return acc
  }, {} as Record<string, ClienteLink[]>)

  if (loading && links.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Links Úteis</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os links úteis do cliente. Você pode adicionar quantos links quiser de cada tipo.
          </p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Link
          </button>
        )}
      </div>

      {/* Formulário de adicionar/editar */}
      {(isAdding || editingId) && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground">
              {isAdding ? 'Adicionar Novo Link' : 'Editar Link'}
            </h4>
            <button
              onClick={handleCancel}
              className="p-1 rounded-md hover:bg-muted"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tipo/Classificação <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="tipos-sugeridos"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Instagram, Facebook, Dashboard..."
              />
              <datalist id="tipos-sugeridos">
                {tiposSugeridos.map((tipo) => (
                  <option key={tipo} value={tipo} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Pessoa (opcional)
              </label>
              <input
                type="text"
                value={formData.pessoa}
                onChange={(e) => setFormData({ ...formData, pessoa: e.target.value })}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: João Silva, Maria Santos..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })
                }
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Lista de links agrupados por tipo */}
      {Object.keys(linksPorTipo).length === 0 && !isAdding && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum link cadastrado ainda.</p>
          <p className="text-sm mt-2">Clique em "Adicionar Link" para começar.</p>
        </div>
      )}

      {Object.entries(linksPorTipo).map(([tipo, linksDoTipo]) => (
        <div key={tipo} className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-muted px-6 py-3 border-b border-border">
            <h4 className="font-semibold text-foreground">{tipo}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {linksDoTipo.length} {linksDoTipo.length === 1 ? 'link' : 'links'}
            </p>
          </div>
          <div className="divide-y divide-border">
            {linksDoTipo.map((link) => (
              <div
                key={link.id}
                className={`px-6 py-4 hover:bg-muted transition-colors ${
                  link.status === 'inativo' ? 'opacity-60' : ''
                }`}
              >
                {editingId === link.id ? (
                  // Formulário de edição inline
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Tipo/Classificação
                        </label>
                        <input
                          type="text"
                          list="tipos-sugeridos"
                          value={formData.tipo}
                          onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Pessoa
                        </label>
                        <input
                          type="text"
                          value={formData.pessoa}
                          onChange={(e) => setFormData({ ...formData, pessoa: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-2">URL</label>
                        <input
                          type="url"
                          value={formData.url}
                          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                        >
                          <option value="ativo">Ativo</option>
                          <option value="inativo">Inativo</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Visualização do link
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenLink(link.url)}
                          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                          title="Abrir link"
                        >
                          <ExternalLink className="w-5 h-5 flex-shrink-0" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-foreground hover:text-primary truncate"
                            >
                              {link.url}
                            </a>
                            {link.status === 'inativo' && (
                              <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                                Inativo
                              </span>
                            )}
                          </div>
                          {link.pessoa && (
                            <p className="text-xs text-muted-foreground mt-1">Pessoa: {link.pessoa}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(link)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Editar link"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(link)}
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        title="Excluir link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
