import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { getAdsMetaOAuthRedirectUri } from '@/modules/ads/config'
import { exchangeCodeForToken } from '@/modules/ads/services/metaApi'

export default function AdsMetaCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) {
      setError('Código de autorização não encontrado.')
      return
    }

    sessionStorage.removeItem('meta_status_cache')

    const redirectUri = getAdsMetaOAuthRedirectUri()
    exchangeCodeForToken(code, redirectUri)
      .then((data: { access_token?: string }) => {
        if (data.access_token) {
          navigate('/ads', { replace: true })
        } else {
          setError('Token não retornado pelo servidor.')
        }
      })
      .catch((err: Error) => setError(err.message))
  }, [navigate])

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <p className="font-display font-semibold text-destructive">Erro na autenticação</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link to="/ads" className="text-sm text-primary underline">
            Voltar ao módulo Ads
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="font-display text-sm">Autenticando com o Meta...</span>
      </div>
    </div>
  )
}
