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
    <div className="glass-card rounded-xl p-4 space-y-3">
      <p className="text-xs font-display font-semibold text-muted-foreground">Fluxo de publicacao</p>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {steps.map((step, index) => {
          const isActive = step.id === activeStep
          const isCompleted = index < activeIndex
          const isEnabled = enabledByStep[step.id]

          return (
            <Button
              key={step.id}
              type="button"
              variant={isActive ? 'default' : 'outline'}
              className="h-auto justify-start py-2 px-3"
              onClick={() => onStepClick(step.id)}
              disabled={!isEnabled}
            >
              <div className="flex items-start gap-2 text-left">
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold">{step.label}</p>
                  <p className="text-[10px] opacity-80">{step.description}</p>
                </div>
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

