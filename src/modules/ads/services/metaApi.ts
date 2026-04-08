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
type FlowStep = 'setup' | 'campaign' | 'audience' | 'fase3' | 'review'

function readJwtExpMillis(jwt: string | null | undefined): number | null {
  if (!jwt) return null
  try {
    const parts = jwt.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

async function getAuthInvokeOptions() {
  const { data } = await supabase.auth.getSession()
  let accessToken = data.session?.access_token ?? null
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-setup-auth',hypothesisId:'H1',location:'metaApi.ts:getAuthInvokeOptions:getSession',message:'session snapshot before refresh',data:{hasSessionToken:Boolean(accessToken)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (!accessToken) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    accessToken = refreshed.session?.access_token ?? null
    // #region agent log
    fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-setup-auth',hypothesisId:'H1',location:'metaApi.ts:getAuthInvokeOptions:refreshSession',message:'session snapshot after refresh attempt',data:{hasRefreshedToken:Boolean(accessToken)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  if (!accessToken) {
    return {}
  }

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
}

async function getRequiredAuthInvokeOptions(step: FlowStep) {
  const options = await getAuthInvokeOptions()
  const hasAuthHeader = Boolean(options.headers?.Authorization)
  if (!hasAuthHeader) {
    throw new Error(formatStepError(step, 'Sessao expirada. Faca login novamente para continuar.'))
  }
  return options
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
    const err = error as {
      message?: string
      context?: { error?: string; message?: string; code?: string; status?: number; statusText?: string }
    }
    if (typeof err.context?.message === 'string') return err.context.message
    if (typeof err.context?.error === 'string') return err.context.error
    if (err.message === 'Edge Function returned a non-2xx status code') {
      const status = err.context?.status
      if (status === 401) return 'Sessao invalida/expirada ao chamar a Edge Function. Faca login novamente.'
      if (status === 400) return 'Token Meta invalido ou expirado. Reconecte sua conta Meta.'
      if (status === 403) return 'Permissao negada na Edge Function para esta operacao.'
      if (status === 404) return 'Edge Function nao encontrada no ambiente atual.'
      if (status === 429) return 'Meta/Supabase limitou requisicoes. Aguarde alguns segundos e tente novamente.'
      if (status && status >= 500) return 'Falha interna da Edge Function. Tente novamente em instantes.'
      if (status) return `Edge Function retornou status ${status}${err.context?.statusText ? ` (${err.context.statusText})` : ''}.`
    }
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

function formatStepError(step: FlowStep, message: string) {
  const labelByStep: Record<FlowStep, string> = {
    setup: 'Setup',
    campaign: 'Campanha',
    audience: 'Publico',
    fase3: 'WhatsApp',
    review: 'Revisao/Publicacao',
  }

  return `Etapa ${labelByStep[step]}: ${message}`
}

function buildStepError(step: FlowStep, error: unknown, fallbackMessage: string) {
  const message = extractFunctionErrorMessage(error) || fallbackMessage
  return new Error(formatStepError(step, message))
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
    throw buildStepError('setup', error, 'Falha ao concluir callback OAuth da Meta.')
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

    throw buildStepError('setup', error, 'Falha ao consultar status da conexao Meta.')
  }
  return data as MetaStatusResponse
}

export async function disconnectMeta() {
  await deleteCurrentUserMetaConnection()
  sessionStorage.removeItem('meta_status_cache')
  sessionStorage.removeItem('meta_oauth_success')
}

export async function fetchAdAccounts(accessToken: string): Promise<AdAccount[]> {
  const authOptions = await getRequiredAuthInvokeOptions('setup')
  const rawAuthHeader = authOptions.headers?.Authorization ?? null
  const sessionJwt = rawAuthHeader?.startsWith('Bearer ') ? rawAuthHeader.slice(7) : null
  const jwtExpMs = readJwtExpMillis(sessionJwt)
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-setup-adaccounts',hypothesisId:'H2',location:'metaApi.ts:fetchAdAccounts:invoke',message:'invoking meta-ad-accounts',data:{hasMetaAccessToken:Boolean(accessToken),hasAuthHeader:Boolean(authOptions.headers?.Authorization),jwtExpiresInMs:jwtExpMs?jwtExpMs-Date.now():null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const firstTry = await supabase.functions.invoke('meta-ad-accounts', {
    ...authOptions,
    body: { access_token: accessToken },
  })
  if (firstTry.error) {
    const details = extractFunctionErrorDebugData(firstTry.error)
    // #region agent log
    fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-setup-adaccounts',hypothesisId:'H3',location:'metaApi.ts:fetchAdAccounts:error',message:'meta-ad-accounts failed',data:{contextStatus:details.contextStatus,contextCode:details.contextCode,contextMessage:details.contextMessage,errorMessage:details.errorMessage},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (details.contextStatus === 401) {
      // #region agent log
      fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-setup-adaccounts',hypothesisId:'H6',location:'metaApi.ts:fetchAdAccounts:retryWithoutCustomHeaders:start',message:'retrying invoke without custom auth headers',data:{previousStatus:details.contextStatus},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const secondTry = await supabase.functions.invoke('meta-ad-accounts', {
        body: { access_token: accessToken },
      })
      if (!secondTry.error) {
        // #region agent log
        fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-setup-adaccounts',hypothesisId:'H6',location:'metaApi.ts:fetchAdAccounts:retryWithoutCustomHeaders:success',message:'retry succeeded without custom headers',data:{accountsCount:Array.isArray(secondTry.data?.accounts)?secondTry.data.accounts.length:0},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return (secondTry.data?.accounts as AdAccount[]) || []
      }
      const retryDetails = extractFunctionErrorDebugData(secondTry.error)
      // #region agent log
      fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-setup-adaccounts',hypothesisId:'H6',location:'metaApi.ts:fetchAdAccounts:retryWithoutCustomHeaders:error',message:'retry without custom headers failed',data:{contextStatus:retryDetails.contextStatus,errorMessage:retryDetails.errorMessage},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }
    throw buildStepError('setup', firstTry.error, 'Nao foi possivel carregar contas de anuncios.')
  }
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-setup-adaccounts',hypothesisId:'H4',location:'metaApi.ts:fetchAdAccounts:success',message:'meta-ad-accounts succeeded',data:{accountsCount:Array.isArray(firstTry.data?.accounts)?firstTry.data.accounts.length:0},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return (firstTry.data?.accounts as AdAccount[]) || []
}

export async function fetchIgAccountsForAdAccount(
  accessToken: string,
  adAccountId: string,
): Promise<IgAccountMapping[]> {
  const authOptions = await getRequiredAuthInvokeOptions('setup')
  const { data, error } = await supabase.functions.invoke('meta-ad-accounts', {
    ...authOptions,
    body: { access_token: accessToken, action: 'get_ig_accounts', ad_account_id: adAccountId },
  })
  if (error) throw buildStepError('setup', error, 'Nao foi possivel carregar identidade da conta.')
  return (data?.ig_accounts as IgAccountMapping[]) || []
}

export async function fetchAudiences(accessToken: string, adAccountId: string): Promise<Audience[]> {
  const authOptions = await getRequiredAuthInvokeOptions('audience')
  const { data, error } = await supabase.functions.invoke('meta-audiences', {
    ...authOptions,
    body: { access_token: accessToken, ad_account_id: adAccountId },
  })
  if (error) throw buildStepError('audience', error, 'Nao foi possivel carregar publicos.')
  return (data?.audiences as Audience[]) || []
}

export async function validatePublish(params: Record<string, unknown>): Promise<ValidationResponse> {
  const authOptions = await getRequiredAuthInvokeOptions('review')
  const { data, error } = await supabase.functions.invoke('meta-publish-validate', {
    ...authOptions,
    body: params,
  })
  if (error && data) return data
  if (error) throw buildStepError('review', error, 'Falha na validacao do payload.')
  return data as ValidationResponse
}

export async function validateCreative(params: Record<string, unknown>): Promise<ValidationResponse> {
  const authOptions = await getRequiredAuthInvokeOptions('campaign')
  const { data, error } = await supabase.functions.invoke('meta-validate-creative', {
    ...authOptions,
    body: params,
  })
  if (error && data) return data
  if (error) throw buildStepError('campaign', error, 'Falha na validacao do criativo.')
  return data as ValidationResponse
}

export async function fetchCampaigns(accessToken: string, adAccountId: string): Promise<Campaign[]> {
  const authOptions = await getRequiredAuthInvokeOptions('campaign')
  const { data, error } = await supabase.functions.invoke('meta-campaigns', {
    ...authOptions,
    body: { access_token: accessToken, ad_account_id: adAccountId },
  })
  if (error) throw buildStepError('campaign', error, 'Nao foi possivel carregar campanhas.')
  return (data?.campaigns as Campaign[]) || []
}

export async function fetchWhatsAppNumbers(
  accessToken: string,
  adAccountId?: string,
  pageId?: string,
): Promise<WhatsAppNumber[]> {
  const authOptions = await getRequiredAuthInvokeOptions('fase3')
  const { data, error } = await supabase.functions.invoke('meta-whatsapp-numbers', {
    ...authOptions,
    body: { access_token: accessToken, ad_account_id: adAccountId, page_id: pageId },
  })
  if (error) throw buildStepError('fase3', error, 'Nao foi possivel carregar numeros de WhatsApp.')
  return (data?.numbers as WhatsAppNumber[]) || []
}

export async function searchLocations(accessToken: string, query: string): Promise<LocationResult[]> {
  const authOptions = await getRequiredAuthInvokeOptions('fase3')
  const { data, error } = await supabase.functions.invoke('meta-location-search', {
    ...authOptions,
    body: { access_token: accessToken, query },
  })
  if (error) throw buildStepError('fase3', error, 'Nao foi possivel buscar localizacoes.')
  return data?.locations || []
}

export async function publishAd(params: Record<string, unknown>): Promise<PublishResponse> {
  const authOptions = await getRequiredAuthInvokeOptions('review')
  const { data, error } = await supabase.functions.invoke('meta-publish', {
    ...authOptions,
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
    return {
      ok: false,
      step: 'review',
      error_message: formatStepError('review', error.message || 'Erro ao publicar'),
      error_user_msg: extractFunctionErrorMessage(error),
    }
  }
  return data as PublishResponse
}

export async function runFase3Diagnostic(
  params: Record<string, unknown>,
): Promise<DiagnosticResponse> {
  const authOptions = await getRequiredAuthInvokeOptions('fase3')
  const { data, error } = await supabase.functions.invoke('meta-fase3-diagnostic', {
    ...authOptions,
    body: params,
  })
  if (error && data) return data
  if (error) throw buildStepError('fase3', error, 'Erro no diagnostico FASE 3.')
  return data as DiagnosticResponse
}

export async function runCampaignDiagnostic(
  accessToken: string,
  adAccountId: string,
): Promise<DiagnosticResponse> {
  const authOptions = await getRequiredAuthInvokeOptions('campaign')
  const { data, error } = await supabase.functions.invoke('meta-campaign-diagnostic', {
    ...authOptions,
    body: { access_token: accessToken, ad_account_id: adAccountId },
  })
  if (error && data) return data
  if (error) throw buildStepError('campaign', error, 'Erro no diagnostico de campanhas.')
  return data as DiagnosticResponse
}

export async function runFase1Diagnostic(params: {
  access_token: string
  good_ad_id: string
  bad_ad_id: string
  ad_account_id?: string
}): Promise<DiagnosticResponse> {
  const authOptions = await getRequiredAuthInvokeOptions('campaign')
  const { data, error } = await supabase.functions.invoke('meta-fase1-diagnostic', {
    ...authOptions,
    body: params,
  })
  if (error && data) return data
  if (error) throw buildStepError('campaign', error, 'Erro no diagnostico FASE 1.')
  return data as DiagnosticResponse
}

export async function runAdsetDiff(params: {
  access_token: string
  ad_account_id: string
  app_adset_payload?: Record<string, unknown>
}): Promise<DiagnosticResponse> {
  const authOptions = await getRequiredAuthInvokeOptions('campaign')
  const { data, error } = await supabase.functions.invoke('meta-adset-diff', {
    ...authOptions,
    body: params,
  })
  if (error && data) return data
  if (error) throw buildStepError('campaign', error, 'Erro no diagnostico de diff de adset.')
  return data as DiagnosticResponse
}
