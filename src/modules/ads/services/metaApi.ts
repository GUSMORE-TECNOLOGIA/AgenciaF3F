import { supabase } from '@/services/supabase'
import { getAdsMetaOAuthRedirectUri } from '@/modules/ads/config'
import type {
  AdAccount,
  Audience,
  Campaign,
  DiagnosticResponse,
  IgAccountMapping,
  LocationResult,
  MetaOAuthCallbackResponse,
  MetaStatusResponse,
  PublishResponse,
  ValidationResponse,
  WhatsAppNumber,
} from '@/modules/ads/types/meta-api'
export type { LocationResult } from '@/modules/ads/types/meta-api'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export function getMetaLoginUrl() {
  return `${SUPABASE_URL}/functions/v1/meta-login`
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri?: string,
): Promise<MetaOAuthCallbackResponse> {
  const { data, error } = await supabase.functions.invoke('meta-oauth-callback', {
    body: { code, redirect_uri: redirectUri ?? getAdsMetaOAuthRedirectUri() },
  })
  if (error) {
    const message =
      typeof (error as { context?: { error?: string } }).context?.error === 'string'
        ? (error as { context: { error: string } }).context.error
        : error.message
    throw new Error(message)
  }
  return data as MetaOAuthCallbackResponse
}

export async function fetchMetaStatus(): Promise<MetaStatusResponse> {
  const { data, error } = await supabase.functions.invoke('meta-status')
  if (error) throw new Error(error.message)
  return data as MetaStatusResponse
}

export async function disconnectMeta() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { error } = await supabase.from('meta_connections').delete().eq('user_id', user.id)
  if (error) throw new Error(error.message)
  sessionStorage.removeItem('meta_status_cache')
}

export async function fetchAdAccounts(accessToken: string): Promise<AdAccount[]> {
  const { data, error } = await supabase.functions.invoke('meta-ad-accounts', {
    body: { access_token: accessToken },
  })
  if (error) throw new Error(error.message)
  return (data?.accounts as AdAccount[]) || []
}

export async function fetchIgAccountsForAdAccount(
  accessToken: string,
  adAccountId: string,
): Promise<IgAccountMapping[]> {
  const { data, error } = await supabase.functions.invoke('meta-ad-accounts', {
    body: { access_token: accessToken, action: 'get_ig_accounts', ad_account_id: adAccountId },
  })
  if (error) throw new Error(error.message)
  return (data?.ig_accounts as IgAccountMapping[]) || []
}

export async function fetchAudiences(accessToken: string, adAccountId: string): Promise<Audience[]> {
  const { data, error } = await supabase.functions.invoke('meta-audiences', {
    body: { access_token: accessToken, ad_account_id: adAccountId },
  })
  if (error) throw new Error(error.message)
  return (data?.audiences as Audience[]) || []
}

export async function validatePublish(params: Record<string, unknown>): Promise<ValidationResponse> {
  const { data, error } = await supabase.functions.invoke('meta-publish-validate', {
    body: params,
  })
  if (error && data) return data
  if (error) throw new Error(error.message)
  return data as ValidationResponse
}

export async function validateCreative(params: Record<string, unknown>): Promise<ValidationResponse> {
  const { data, error } = await supabase.functions.invoke('meta-validate-creative', {
    body: params,
  })
  if (error && data) return data
  if (error) throw new Error(error.message)
  return data as ValidationResponse
}

export async function fetchCampaigns(accessToken: string, adAccountId: string): Promise<Campaign[]> {
  const { data, error } = await supabase.functions.invoke('meta-campaigns', {
    body: { access_token: accessToken, ad_account_id: adAccountId },
  })
  if (error) throw new Error(error.message)
  return (data?.campaigns as Campaign[]) || []
}

export async function fetchWhatsAppNumbers(
  accessToken: string,
  adAccountId?: string,
  pageId?: string,
): Promise<WhatsAppNumber[]> {
  const { data, error } = await supabase.functions.invoke('meta-whatsapp-numbers', {
    body: { access_token: accessToken, ad_account_id: adAccountId, page_id: pageId },
  })
  if (error) throw new Error(error.message)
  return (data?.numbers as WhatsAppNumber[]) || []
}

export async function searchLocations(accessToken: string, query: string): Promise<LocationResult[]> {
  const { data, error } = await supabase.functions.invoke('meta-location-search', {
    body: { access_token: accessToken, query },
  })
  if (error) throw new Error(error.message)
  return data?.locations || []
}

export async function publishAd(params: Record<string, unknown>): Promise<PublishResponse> {
  const { data, error } = await supabase.functions.invoke('meta-publish', {
    body: params,
  })
  if (error && data) return data as PublishResponse
  if (error) {
    try {
      const parsed = typeof error === 'string' ? JSON.parse(error) : error
      if (parsed && typeof parsed === 'object' && ('error_message' in parsed || 'step' in parsed)) {
        return { ok: false, ...(parsed as Record<string, unknown>) } as PublishResponse
      }
    } catch {
      /* ignore */
    }
    throw new Error(error.message || 'Erro ao publicar')
  }
  return data as PublishResponse
}

export async function runFase3Diagnostic(
  params: Record<string, unknown>,
): Promise<DiagnosticResponse> {
  const { data, error } = await supabase.functions.invoke('meta-fase3-diagnostic', {
    body: params,
  })
  if (error && data) return data
  if (error) throw new Error(error.message || 'Erro no diagnóstico')
  return data as DiagnosticResponse
}

export async function runCampaignDiagnostic(
  accessToken: string,
  adAccountId: string,
): Promise<DiagnosticResponse> {
  const { data, error } = await supabase.functions.invoke('meta-campaign-diagnostic', {
    body: { access_token: accessToken, ad_account_id: adAccountId },
  })
  if (error && data) return data
  if (error) throw new Error(error.message || 'Erro no diagnóstico de campanhas')
  return data as DiagnosticResponse
}

export async function runFase1Diagnostic(params: {
  access_token: string
  good_ad_id: string
  bad_ad_id: string
  ad_account_id?: string
}): Promise<DiagnosticResponse> {
  const { data, error } = await supabase.functions.invoke('meta-fase1-diagnostic', {
    body: params,
  })
  if (error && data) return data
  if (error) throw new Error(error.message || 'Erro no diagnóstico FASE 1')
  return data as DiagnosticResponse
}

export async function runAdsetDiff(params: {
  access_token: string
  ad_account_id: string
  app_adset_payload?: Record<string, unknown>
}): Promise<DiagnosticResponse> {
  const { data, error } = await supabase.functions.invoke('meta-adset-diff', {
    body: params,
  })
  if (error && data) return data
  if (error) throw new Error(error.message || 'Erro no diff de adset')
  return data as DiagnosticResponse
}
