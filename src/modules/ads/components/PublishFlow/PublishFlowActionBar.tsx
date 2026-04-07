import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface PublishFlowActionBarProps {
  canGoBack: boolean
  canGoNext: boolean
  onBack: () => void
  onNext: () => void
  isReviewStep?: boolean
}

export function PublishFlowActionBar({ canGoBack, canGoNext, onBack, onNext, isReviewStep }: PublishFlowActionBarProps) {
  return (
    <div className="sticky bottom-0 z-20 pt-2">
      <div className="glass-card border border-border/50 rounded-2xl p-4 flex items-center justify-between gap-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <Button type="button" variant="outline" onClick={onBack} disabled={!canGoBack} className="gap-2 min-w-28">
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </Button>
        <Button type="button" onClick={onNext} disabled={!canGoNext} className="gap-2 min-w-28">
          Proximo
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      {!isReviewStep && (
        <p className="text-[11px] text-muted-foreground mt-2 px-1">
          Dica: avance livremente e finalize com <strong>Validar</strong> na etapa Revisao.
        </p>
      )}
    </div>
  )
}

