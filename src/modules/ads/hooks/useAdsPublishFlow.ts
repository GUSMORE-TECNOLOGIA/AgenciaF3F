import { useEffect, useMemo, useState } from 'react'

export type AdsFlowStepId = 'setup' | 'campaign' | 'audience' | 'fase3' | 'review'

export interface AdsFlowStep {
  id: AdsFlowStepId
  label: string
  description: string
}

interface UseAdsPublishFlowArgs {
  isFase3: boolean
  hasAccessToken: boolean
  hasSelectedAccount: boolean
  hasSelectedCampaignContext: boolean
  hasAudience: boolean
  hasBudget: boolean
  hasFase3RequiredFields: boolean
}

export function useAdsPublishFlow(args: UseAdsPublishFlowArgs) {
  const [activeStep, setActiveStep] = useState<AdsFlowStepId>('setup')
  const [campaignTab, setCampaignTab] = useState<'campaign' | 'naming' | 'creatives'>('campaign')
  const [audienceTab, setAudienceTab] = useState<'audience' | 'budget' | 'schedule'>('audience')

  const steps = useMemo<AdsFlowStep[]>(
    () => [
      { id: 'setup', label: 'Setup', description: 'Conexao, conta e preset' },
      { id: 'campaign', label: 'Campanha', description: 'Estrutura, nomes e criativos' },
      { id: 'audience', label: 'Publico', description: 'Segmentacao, orcamento e agenda' },
      ...(args.isFase3 ? [{ id: 'fase3', label: 'WhatsApp', description: 'Campos extras da FASE 3' } as AdsFlowStep] : []),
      { id: 'review', label: 'Revisao', description: 'Validar e publicar' },
    ],
    [args.isFase3],
  )

  const enabledByStep = useMemo<Record<AdsFlowStepId, boolean>>(
    () => ({
      setup: true,
      campaign: args.hasAccessToken && args.hasSelectedAccount,
      audience: args.hasAccessToken && args.hasSelectedAccount && args.hasSelectedCampaignContext,
      fase3: args.hasAccessToken && args.hasSelectedAccount && args.hasAudience && args.hasBudget,
      review:
        args.hasAccessToken &&
        args.hasSelectedAccount &&
        args.hasSelectedCampaignContext &&
        args.hasAudience &&
        args.hasBudget &&
        (!args.isFase3 || args.hasFase3RequiredFields),
    }),
    [args],
  )

  const stepIndex = steps.findIndex((s) => s.id === activeStep)

  useEffect(() => {
    if (!steps.some((step) => step.id === activeStep)) {
      setActiveStep('review')
    }
  }, [steps, activeStep])

  function goToStep(stepId: AdsFlowStepId) {
    if (!steps.some((step) => step.id === stepId)) return
    setActiveStep(stepId)
  }

  function goNext() {
    const next = steps[stepIndex + 1]
    if (!next) return
    setActiveStep(next.id)
  }

  function goBack() {
    const prev = steps[stepIndex - 1]
    if (!prev) return
    setActiveStep(prev.id)
  }

  return {
    steps,
    activeStep,
    campaignTab,
    audienceTab,
    enabledByStep,
    canGoBack: stepIndex > 0,
    canGoNext: stepIndex < steps.length - 1,
    goToStep,
    goNext,
    goBack,
    setCampaignTab,
    setAudienceTab,
  }
}

