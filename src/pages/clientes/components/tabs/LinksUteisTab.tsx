import { useState } from 'react'
import { Cliente } from '@/types'
import { useUpdateLinksUteis, useUpdateCliente } from '@/hooks/useCliente'
import LinksUteisEditor from '../LinksUteisEditor'
import { Save, Loader2, Folder } from 'lucide-react'

interface LinksUteisTabProps {
  cliente: Cliente
  onSave?: () => void
}

export default function LinksUteisTab({ cliente, onSave }: LinksUteisTabProps) {
  const { update: updateLinks } = useUpdateLinksUteis(cliente.id)
  const { update: updateCliente, loading: updatingCliente } = useUpdateCliente(cliente.id)
  const [driveUrl, setDriveUrl] = useState(cliente.drive_url || '')
  const [savingDriveUrl, setSavingDriveUrl] = useState(false)

  const handleSaveLinks = async (links: any) => {
    try {
      await updateLinks(links)
      if (onSave) onSave()
    } catch (error) {
      console.error('Erro ao salvar links úteis:', error)
      throw error
    }
  }

  const handleSaveDriveUrl = async () => {
    try {
      setSavingDriveUrl(true)
      await updateCliente({ drive_url: driveUrl || undefined })
      if (onSave) onSave()
    } catch (error) {
      console.error('Erro ao salvar URL do Google Drive:', error)
      alert('Erro ao salvar URL do Google Drive. Tente novamente.')
    } finally {
      setSavingDriveUrl(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Google Drive Principal */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="border-b border-gray-200 px-6 py-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            Google Drive Principal
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="drive_url" className="block text-sm font-medium text-gray-700 mb-2">
                URL do Google Drive do Cliente
              </label>
              <div className="flex gap-3">
                <input
                  id="drive_url"
                  type="url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="flex-1 h-9 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="https://drive.google.com/..."
                />
                <button
                  onClick={handleSaveDriveUrl}
                  disabled={savingDriveUrl || updatingCliente || driveUrl === (cliente.drive_url || '')}
                  className="flex items-center gap-2 px-4 py-2 h-9 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(savingDriveUrl || updatingCliente) && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                URL principal do Google Drive do cliente para acesso aos arquivos e documentos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Links Úteis */}
      <div>
        <LinksUteisEditor
          links={cliente.links_uteis || {}}
          onSave={handleSaveLinks}
          readOnly={false}
        />
      </div>
    </div>
  )
}
