import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface PublishFlowActionBarProps {
  canGoBack: boolean
  canGoNext: boolean
  onBack: () => void
  onNext: () => void
}

export function PublishFlowActionBar({ canGoBack, canGoNext, onBack, onNext }: PublishFlowActionBarProps) {
  return (
    <div className="sticky bottom-0 z-10">
      <div className="glass-card border border-border/50 rounded-xl p-3 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={!canGoBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </Button>
        <Button type="button" onClick={onNext} disabled={!canGoNext} className="gap-2">
          Proximo
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

