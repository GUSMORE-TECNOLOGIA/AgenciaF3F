import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

import { fetchMetaStatus } from '@/modules/ads/services/metaApi'
import { Button } from '@/modules/ads/ui/button'
import { Card } from '@/modules/ads/ui/card'
import { Label } from '@/modules/ads/ui/label'

export default function AdsSettingsPage() {
  const [metaStatus, setMetaStatus] = useState<{
    connected: boolean
    meta_name?: string
    expires_at?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetaStatus()
      .then(setMetaStatus)
      .catch(() => setMetaStatus({ connected: false }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold">Configurações — Meta Ads</h1>
          <Button variant="outline" size="sm" asChild>
            <Link to="/ads">Voltar</Link>
          </Button>
        </div>

        <Card className="glass-card space-y-4 p-6">
          <Label className="font-display text-sm font-semibold">Conexão Meta</Label>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
              {metaStatus?.connected ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <div>
                    <span className="text-sm">Conectado</span>
                    {metaStatus.meta_name && (
                      <p className="text-xs text-muted-foreground">{metaStatus.meta_name}</p>
                    )}
                    {metaStatus.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expira: {new Date(metaStatus.expires_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm">Desconectado</span>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
