import { supabase } from '@/services/supabase'
import { getAdsMetaOAuthRedirectUri } from '@/modules/ads/config'
import { deleteCurrentUserMetaConnection } from '@/modules/ads/repositories/metaConnectionRepository'
import { fetchCurrentUserMetaConnection } from '@/modules/ads/repositories/metaConnectionRepository'
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

async function getAuthInvokeOptions() {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token ?? null

  if (!accessToken) {
    return {}
  }

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
}

async function diagnoseMetaStatus401() {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  const userId = userData.user?.id ?? null
  if (userError || !userId) return

  await supabase
    .from('meta_connections')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
}

async function fallbackMetaStatusFromDb(): Promise<MetaStatusResponse> {
  const connection = await fetchCurrentUserMetaConnection()

  if (!connection?.access_token) {
    return {
      connected: false,
      reason: 'no_connection',
      error: 'Sem conexão Meta persistida para o usuário.',
    }
  }

  const expiresAt = connection.expires_at
  const expiresDate = expiresAt ? new Date(expiresAt) : null
  const isExpired = Boolean(expiresDate && expiresDate.getTime() < Date.now())
  if (isExpired) {
    return {
      connected: false,
      reason: 'expired',
      error: 'Token Meta expirado.',
      expires_at: expiresAt ?? undefined,
    }
  }

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const expiresSoon = Boolean(expiresDate && (expiresDate.getTime() - Date.now()) < sevenDaysMs)
  return {
    connected: true,
    access_token: connection.access_token,
    expires_at: expiresAt ?? undefined,
    expires_soon: expiresSoon,
  }
}

function extractFunctionErrorMessage(error: unknown) {
  if (!error) return 'Erro desconhecido'
  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string; context?: { error?: string; message?: string; code?: string } }
    if (typeof err.context?.message === 'string') return err.context.message
    if (typeof err.context?.error === 'string') return err.context.error
    if (typeof err.message === 'string') return err.message
  }
  return 'Erro desconhecido'
}

function extractFunctionErrorDebugData(error: unknown) {
  if (!error || typeof error !== 'object') {
    return { errorType: typeof error }
  }

  const err = error as {
    name?: string
    message?: string
    code?: string
    context?: {
      status?: number
      statusText?: string
      error?: string
      message?: string
      code?: string
      details?: string
    }
  }

  return {
    errorName: err.name ?? null,
    errorCode: err.code ?? null,
    errorMessage: err.message ?? null,
    contextStatus: err.context?.status ?? null,
    contextStatusText: err.context?.statusText ?? null,
    contextCode: err.context?.code ?? null,
    contextMessage: err.context?.message ?? null,
    contextError: err.context?.error ?? null,
    contextDetails: err.context?.details ?? null,
    keys: Object.keys(err),
  }
}

export function getMetaLoginUrl() {
  const redirectUri = getAdsMetaOAuthRedirectUri()
  const url = new URL(`${SUPABASE_URL}/functions/v1/meta-login`)
  url.searchParams.set('redirect_uri', redirectUri)
  return url.toString()
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri?: string,
): Promise<MetaOAuthCallbackResponse> {
  const authOptions = await getAuthInvokeOptions()
  const { data, error } = await supabase.functions.invoke('meta-oauth-callback', {
    ...authOptions,
    body: { code, redirect_uri: redirectUri ?? getAdsMetaOAuthRedirectUri() },
  })
  if (error) {
    throw new Error(extractFunctionErrorMessage(error))
  }
  return data as MetaOAuthCallbackResponse
}

export async function fetchMetaStatus(options?: { forceVerify?: boolean }): Promise<MetaStatusResponse> {
  const payload = options?.forceVerify ? { force_verify: true } : undefined
  const authOptions = await getAuthInvokeOptions()
  const { data, error } = await supabase.functions.invoke('meta-status', {
    ...authOptions,
    body: payload,
  })
  if (error) {
    const details = extractFunctionErrorDebugData(error)

    if (details.contextStatus === 401) {
      await diagnoseMetaStatus401()
      return await fallbackMetaStatusFromDb()
    }

    throw new Error(extractFunctionErrorMessage(error))
  }
  return data as MetaStatusResponse
}

export async function disconnectMeta() {
  await deleteCurrentUserMetaConnection()
  sessionStorage.removeItem('meta_status_cache')
  sessionStorage.removeItem('meta_oauth_success')
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
