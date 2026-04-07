import { CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { AdsFlowStep, AdsFlowStepId } from '@/modules/ads/hooks/useAdsPublishFlow'

interface PublishFlowStepperProps {
  steps: AdsFlowStep[]
  activeStep: AdsFlowStepId
  enabledByStep: Record<AdsFlowStepId, boolean>
  onStepClick: (stepId: AdsFlowStepId) => void
}

export function PublishFlowStepper({ steps, activeStep, enabledByStep, onStepClick }: PublishFlowStepperProps) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep)

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <p className="text-sm font-display font-semibold text-muted-foreground">Fluxo de publicacao</p>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
        {steps.map((step, index) => {
          const isActive = step.id === activeStep
          const isCompleted = index < activeIndex
          const isReady = enabledByStep[step.id]

          return (
            <Button
              key={step.id}
              type="button"
              variant={isActive ? 'default' : 'outline'}
              className="h-auto min-h-14 justify-start py-2.5 px-3"
              onClick={() => onStepClick(step.id)}
            >
              <div className="flex items-start gap-2 text-left">
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{step.label}</p>
                  <p className="text-[11px] opacity-80 leading-tight">{step.description}</p>
                  {!isReady && (
                    <p className="text-[10px] opacity-70 mt-0.5">Pendente</p>
                  )}
                </div>
              </div>
            </Button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Navegacao livre entre etapas. A validacao final acontece na etapa de revisao.
      </p>
    </div>
  )
}

