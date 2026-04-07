import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { getAdsMetaOAuthRedirectUri } from '@/modules/ads/config'
import { exchangeCodeForToken, fetchMetaStatus } from '@/modules/ads/services/metaApi'

export default function AdsMetaCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    // #region agent log
    fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-initial',hypothesisId:'H2',location:'AdsMetaCallbackPage.tsx:useEffect:start',message:'callback page started',data:{hasCode:Boolean(code),path:window.location.pathname,search:window.location.search.includes('code=')?'has_code_param':'no_code_param'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!code) {
      setError('Código de autorização não encontrado.')
      return
    }

    sessionStorage.removeItem('meta_status_cache')

    const redirectUri = getAdsMetaOAuthRedirectUri()
    exchangeCodeForToken(code, redirectUri)
      .then(async (data: { access_token?: string; saved_to_db?: boolean }) => {
        // #region agent log
        fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-initial',hypothesisId:'H1',location:'AdsMetaCallbackPage.tsx:exchangeCodeForToken:then',message:'oauth exchange response',data:{hasAccessToken:Boolean(data.access_token),savedToDb:data.saved_to_db ?? null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (!data.access_token) {
          setError('Token não retornado pelo servidor.')
          return
        }

        if (data.saved_to_db === false) {
          setError('Conectou no Meta, mas não foi possível salvar a conexão no usuário atual. Entre novamente e tente de novo.')
          return
        }

        for (let attempt = 0; attempt < 3; attempt += 1) {
          const status = await fetchMetaStatus()
          // #region agent log
          fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-initial',hypothesisId:'H3',location:'AdsMetaCallbackPage.tsx:fetchMetaStatus:retry',message:'status after oauth',data:{attempt,connected:Boolean(status.connected),hasAccessToken:Boolean(status.access_token),reason:status.reason ?? null},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          if (status.connected && status.access_token) {
            sessionStorage.setItem('meta_status_cache', JSON.stringify({ ...status, _cachedAt: Date.now() }))
            sessionStorage.setItem('meta_oauth_success', String(Date.now()))
            navigate('/ads', { replace: true })
            return
          }
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        setError('Conexão Meta concluída, mas o status não sincronizou. Recarregue a página /ads e tente novamente.')
      })
      .catch((err: Error) => {
        // #region agent log
        fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-initial',hypothesisId:'H5',location:'AdsMetaCallbackPage.tsx:exchangeCodeForToken:catch',message:'oauth callback failed',data:{errorMessage:err.message},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setError(err.message)
      })
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
