import { Link } from 'react-router-dom'
import { Settings2 } from 'lucide-react'

import PublishForm from '@/modules/ads/components/PublishForm'
import { Button } from '@/modules/ads/ui/button'

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
        <PublishForm />
      </div>
    </div>
  )
}
