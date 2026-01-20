import { useState, useRef } from 'react'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { supabase } from '@/services/supabase'

interface ClienteLogoUploadProps {
  logoUrl?: string
  onUpload: (url: string) => Promise<void>
  onRemove: () => Promise<void>
  clienteId: string
  clienteNome: string
}

export default function ClienteLogoUpload({
  logoUrl,
  onUpload,
  onRemove,
  clienteId,
  clienteNome,
}: ClienteLogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(logoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem')
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    try {
      setUploading(true)

      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${clienteId}-${Date.now()}.${fileExt}`
      const filePath = `clientes/${clienteId}/${fileName}`

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('clientes-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        // Se o bucket não existir, criar um temporário ou usar URL externa
        console.warn('Erro ao fazer upload para Supabase Storage:', uploadError)
        // Por enquanto, usar data URL como fallback
        // Em produção, você deve configurar o bucket 'clientes-logos' no Supabase
        alert('Erro ao fazer upload. Configure o bucket "clientes-logos" no Supabase Storage.')
        setUploading(false)
        return
      }

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('clientes-logos').getPublicUrl(filePath)

      await onUpload(publicUrl)
    } catch (error) {
      console.error('Erro ao processar imagem:', error)
      alert('Erro ao fazer upload da logo. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Deseja remover a logo do cliente?')) return

    try {
      setUploading(true)
      setPreview(null)
      await onRemove()
    } catch (error) {
      console.error('Erro ao remover logo:', error)
      alert('Erro ao remover logo. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Preview da Logo */}
      <div className="w-[120px] h-[120px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt={`Logo de ${clienteNome}`}
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <Camera className="h-8 w-8 text-gray-400" />
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          id="logo-upload"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-9 w-9 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Upload"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-9 w-9 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Câmera"
        >
          <Camera className="h-4 w-4" />
        </button>

        {preview && !uploading && (
          <>
            <button
              type="button"
              onClick={handleRemove}
              className="h-9 w-9 flex items-center justify-center border border-gray-300 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              title="Excluir logo"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Informações de formato */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>Formatos: JPG, PNG, WEBP (máx. 5MB)</p>
      </div>
    </div>
  )
}
