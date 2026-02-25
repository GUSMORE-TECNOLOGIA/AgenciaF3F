import { useState, useEffect } from 'react'
import { LinksUteis } from '@/types'
import { linksUteisSchema, validateUrl, cleanLinksUteis } from '@/lib/validators/cliente-schema'
import { ExternalLink, Save, Loader2 } from 'lucide-react'

interface LinksUteisEditorProps {
  links: LinksUteis
  onSave: (links: LinksUteis) => Promise<void>
  loading?: boolean
  readOnly?: boolean
}

const linksLabels: Record<keyof LinksUteis, string> = {
  conta_anuncio_f3f: 'Conta de Anúncio - F3F',
  conta_anuncio_lt: 'Conta de Anúncio - L.T',
  instagram: 'Instagram',
  business_suite: 'Business Suite',
  dashboard: 'Dashboard',
  planilha_dados: 'Planilha de Dados',
  utmify: 'UTMify',
  wordpress: 'Wordpress',
  pagina_vendas_lt: 'Página de Vendas - L.T',
  checkout: 'Checkout',
}

export default function LinksUteisEditor({ links: initialLinks, onSave, loading: externalLoading, readOnly = false }: LinksUteisEditorProps) {
  const [links, setLinks] = useState<LinksUteis>(initialLinks || {})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLinks(initialLinks || {})
    setHasChanges(false)
  }, [initialLinks])

  const handleLinkChange = (key: keyof LinksUteis, value: string) => {
    const newLinks = { ...links, [key]: value }
    setLinks(newLinks)
    setHasChanges(true)

    // Validar URL se não estiver vazia
    if (value && value.trim() !== '') {
      if (!validateUrl(value)) {
        setErrors((prev) => ({ ...prev, [key]: 'URL inválida' }))
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[key]
          return newErrors
        })
      }
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setErrors({})

      // Validar todos os links
      const validationErrors: Record<string, string> = {}
      Object.entries(links).forEach(([key, value]) => {
        if (value && value.trim() !== '' && !validateUrl(value)) {
          validationErrors[key] = 'URL inválida'
        }
      })

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

      // Limpar links (remover strings vazias)
      const cleanedLinks = cleanLinksUteis(links as Record<string, string | undefined>)

      // Validar com Zod
      await linksUteisSchema.parseAsync(cleanedLinks)

      await onSave(cleanedLinks)
      setHasChanges(false)
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
        console.error('Erro ao salvar links úteis:', error)
      }
      throw error
    } finally {
      setSaving(false)
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  if (readOnly) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Links Úteis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(linksLabels).map(([key, label]) => {
            const url = links[key as keyof LinksUteis]
            if (!url) return null

            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="font-medium text-foreground">{label}</span>
              </a>
            )
          })}
          {Object.values(links).filter(Boolean).length === 0 && (
            <p className="text-muted-foreground col-span-full">Nenhum link configurado</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Links Úteis</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure os links úteis para este cliente. Deixe em branco para remover.
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={hasErrors || saving || externalLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(saving || externalLoading) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Links
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(linksLabels).map(([key, label]) => {
          const fieldKey = key as keyof LinksUteis
          const value = links[fieldKey] || ''
          const error = errors[fieldKey]

          return (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-foreground mb-2">
                {label}
              </label>
              <div className="relative">
                <input
                  id={key}
                  type="url"
                  value={value}
                  onChange={(e) => handleLinkChange(fieldKey, e.target.value)}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    error ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="https://..."
                />
                {value && validateUrl(value) && (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80"
                    title="Abrir link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
          )
        })}
      </div>

      {hasErrors && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            Corrija os erros de validação antes de salvar
          </p>
        </div>
      )}
    </div>
  )
}
