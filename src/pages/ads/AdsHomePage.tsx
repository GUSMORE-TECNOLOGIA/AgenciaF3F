import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

const PublishForm = lazy(() => import('@/modules/ads/components/PublishForm'))

export default function AdsHomePage() {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">
              Publicar <span className="text-gradient">Anúncio</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Meta Ads (Fase 1 e Fase 3) integrado ao login da agência
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/ads/configuracoes" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Configurações
            </Link>
          </Button>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <PublishForm />
        </Suspense>
      </div>
    </div>
  )
}
