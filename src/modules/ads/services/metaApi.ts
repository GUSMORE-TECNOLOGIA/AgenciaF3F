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

async function fetchAdAccountsFromMetaDirect(accessToken: string): Promise<AdAccount[]> {
  const allAccounts: AdAccount[] = []
  let url: string | null = `https://graph.facebook.com/v22.0/me/adaccounts?fields=id,name&limit=50&access_token=${accessToken}`

  while (url) {
    const response: Response = await fetch(url)
    const payload: Record<string, unknown> = await response.json()
    if (!response.ok || payload?.error) {
      const errorMessage =
        typeof payload?.error === 'object' &&
        payload.error !== null &&
        'message' in payload.error &&
        typeof (payload.error as { message?: unknown }).message === 'string'
          ? (payload.error as { message: string }).message
          : `Meta Graph error (${response.status})`
      throw new Error(errorMessage)
    }
    const data = Array.isArray(payload.data) ? payload.data as Array<{ id: string; name?: string }> : []
    for (const account of data) {
      allAccounts.push({ id: account.id, name: account.name || account.id })
    }
    const paging = payload.paging as { next?: unknown } | undefined
    url = typeof paging?.next === 'string' ? paging.next : null
  }

  return allAccounts
}

async function fetchIgAccountsForAdAccountDirect(
  accessToken: string,
  adAccountId: string,
): Promise<IgAccountMapping[]> {
  const igResponse = await fetch(
    `https://graph.facebook.com/v22.0/${adAccountId}/instagram_accounts?fields=id,username&limit=25&access_token=${accessToken}`,
  )
  const igPayload: Record<string, unknown> = await igResponse.json()
  if (!igResponse.ok || igPayload?.error) {
    const errorMessage =
      typeof igPayload?.error === 'object' &&
      igPayload.error !== null &&
      'message' in igPayload.error &&
      typeof (igPayload.error as { message?: unknown }).message === 'string'
        ? (igPayload.error as { message: string }).message
        : `Meta Graph error (${igResponse.status})`
    throw new Error(errorMessage)
  }

  const igAccounts = Array.isArray(igPayload.data)
    ? (igPayload.data as Array<{ id: string; username?: string | null }>)
    : []
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-identity-ig',hypothesisId:'H6',location:'metaApi.ts:fetchIgAccountsForAdAccountDirect:igAccounts',message:'direct instagram_accounts response parsed',data:{igAccountsCount:igAccounts.length,adAccountIdSuffix:adAccountId.slice(-8)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const pagesResponse = await fetch(
    `https://graph.facebook.com/v22.0/me/accounts?fields=id,name,instagram_business_account{id},whatsapp_business_account{id,name}&limit=200&access_token=${accessToken}`,
  )
  const pagesPayload: Record<string, unknown> = await pagesResponse.json()
  if (!pagesResponse.ok || pagesPayload?.error) {
    const errorMessage =
      typeof pagesPayload?.error === 'object' &&
      pagesPayload.error !== null &&
      'message' in pagesPayload.error &&
      typeof (pagesPayload.error as { message?: unknown }).message === 'string'
        ? (pagesPayload.error as { message: string }).message
        : `Meta Graph error (${pagesResponse.status})`
    throw new Error(errorMessage)
  }

  const pages = Array.isArray(pagesPayload.data)
    ? (pagesPayload.data as Array<{
        id: string
        name?: string
        instagram_business_account?: { id?: string }
      }>)
    : []
  const pagesWithInstagram = pages.filter((page) => Boolean(page.instagram_business_account?.id))
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-identity-ig',hypothesisId:'H7',location:'metaApi.ts:fetchIgAccountsForAdAccountDirect:pages',message:'direct me/accounts response parsed',data:{pagesCount:pages.length,pagesWithInstagramCount:pagesWithInstagram.length,adAccountIdSuffix:adAccountId.slice(-8)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const mappedIgAccounts = igAccounts.map((ig) => {
    const matchedPage = pages.find((page) => page.instagram_business_account?.id === ig.id)
    return {
      ig_account_id: ig.id,
      ig_username: ig.username ?? null,
      page_id: matchedPage?.id ?? null,
      page_name: matchedPage?.name ?? null,
      waba_phone_id: null,
      waba_phone: null,
    }
  })
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-identity-ig',hypothesisId:'H8',location:'metaApi.ts:fetchIgAccountsForAdAccountDirect:mapped',message:'direct ig accounts mapped with pages',data:{mappedCount:mappedIgAccounts.length,mappedWithPageCount:mappedIgAccounts.filter((item)=>Boolean(item.page_id)).length,adAccountIdSuffix:adAccountId.slice(-8)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return mappedIgAccounts
}

function getMetaGraphErrorMessage(payload: Record<string, unknown>, status: number): string {
  if (
    typeof payload?.error === 'object' &&
    payload.error !== null &&
    'message' in payload.error &&
    typeof (payload.error as { message?: unknown }).message === 'string'
  ) {
    return (payload.error as { message: string }).message
  }
  return `Meta Graph error (${status})`
}

async function fetchAudiencesFromMetaDirect(accessToken: string, adAccountId: string): Promise<Audience[]> {
  const customUrl = `https://graph.facebook.com/v22.0/${adAccountId}/customaudiences?fields=id,name&limit=200&access_token=${accessToken}`
  const savedUrl = `https://graph.facebook.com/v22.0/${adAccountId}/saved_audiences?fields=id,name,targeting&limit=200&access_token=${accessToken}`

  const [customRes, savedRes] = await Promise.all([fetch(customUrl), fetch(savedUrl)])
  const [customPayload, savedPayload] = await Promise.all([
    customRes.json() as Promise<Record<string, unknown>>,
    savedRes.json() as Promise<Record<string, unknown>>,
  ])

  if (!customRes.ok || customPayload?.error) {
    throw new Error(getMetaGraphErrorMessage(customPayload, customRes.status))
  }
  if (!savedRes.ok || savedPayload?.error) {
    throw new Error(getMetaGraphErrorMessage(savedPayload, savedRes.status))
  }

  const customItems = Array.isArray(customPayload.data)
    ? (customPayload.data as Array<{ id: string; name?: string }>)
    : []
  const savedItems = Array.isArray(savedPayload.data)
    ? (savedPayload.data as Array<{ id: string; name?: string; targeting?: Record<string, unknown> }>)
    : []

  const customAudiences: Audience[] = customItems.map((aud) => ({
    id: aud.id,
    name: aud.name || aud.id,
    type: 'custom',
    targeting_spec: null,
  }))
  const savedAudiences: Audience[] = savedItems.map((aud) => ({
    id: aud.id,
    name: aud.name || aud.id,
    type: 'saved',
    targeting_spec: aud.targeting ?? null,
  }))

  return [...customAudiences, ...savedAudiences]
}

async function fetchWhatsAppNumbersFromMetaDirect(
  accessToken: string,
  pageId?: string,
): Promise<WhatsAppNumber[]> {
  const pagesUrl = `https://graph.facebook.com/v22.0/me/accounts?fields=id,name,whatsapp_business_account{id}&limit=200&access_token=${accessToken}`
  const pagesRes = await fetch(pagesUrl)
  const pagesPayload: Record<string, unknown> = await pagesRes.json()

  if (!pagesRes.ok || pagesPayload?.error) {
    throw new Error(getMetaGraphErrorMessage(pagesPayload, pagesRes.status))
  }

  const pages = Array.isArray(pagesPayload.data)
    ? (pagesPayload.data as Array<{ id: string; name?: string; whatsapp_business_account?: { id?: string } }>)
    : []
  const filteredPages = pageId ? pages.filter((page) => page.id === pageId) : pages
  const numbers: WhatsAppNumber[] = []

  for (const page of filteredPages) {
    const wabaId = page.whatsapp_business_account?.id
    if (!wabaId) continue
    const phonesUrl = `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name&limit=200&access_token=${accessToken}`
    const phonesRes = await fetch(phonesUrl)
    const phonesPayload: Record<string, unknown> = await phonesRes.json()
    if (!phonesRes.ok || phonesPayload?.error) {
      throw new Error(getMetaGraphErrorMessage(phonesPayload, phonesRes.status))
    }
    const phones = Array.isArray(phonesPayload.data)
      ? (phonesPayload.data as Array<{ id: string; display_phone_number?: string; verified_name?: string }>)
      : []
    for (const phone of phones) {
      const phoneText = phone.display_phone_number || ''
      numbers.push({
        id: phone.id,
        display: phone.verified_name ? `${phone.verified_name} (${phoneText})` : phoneText || phone.id,
        phone: phoneText,
        page_id: page.id,
        page_name: page.name || page.id,
      })
    }
  }

  return numbers
}

async function getAuthInvokeOptions() {
  const { data } = await supabase.auth.getSession()
  let accessToken = data.session?.access_token ?? null

  if (!accessToken) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    accessToken = refreshed.session?.access_token ?? null
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
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-setup-adaccounts',hypothesisId:'H11',location:'metaApi.ts:fetchAdAccounts:invoke',message:'invoking meta-ad-accounts for ad accounts list',data:{hasMetaAccessToken:Boolean(accessToken),hasAuthHeader:Boolean(authOptions.headers?.Authorization)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const firstTry = await supabase.functions.invoke('meta-ad-accounts', {
    ...authOptions,
    body: { access_token: accessToken },
  })
  if (firstTry.error) {
    const details = extractFunctionErrorDebugData(firstTry.error)
    // #region agent log
    fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-setup-adaccounts',hypothesisId:'H12',location:'metaApi.ts:fetchAdAccounts:error',message:'meta-ad-accounts edge call failed',data:{contextStatus:details.contextStatus,contextCode:details.contextCode,errorMessage:details.errorMessage},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (details.contextStatus === 401) {
      try {
        const fallback = await fetchAdAccountsFromMetaDirect(accessToken)
        // #region agent log
        fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-setup-adaccounts',hypothesisId:'H13',location:'metaApi.ts:fetchAdAccounts:fallbackDirect:success',message:'fallback direct graph for ad accounts succeeded',data:{adAccountsCount:fallback.length},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return fallback
      } catch (fallbackError) {
        // #region agent log
        fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-setup-adaccounts',hypothesisId:'H13',location:'metaApi.ts:fetchAdAccounts:fallbackDirect:error',message:'fallback direct graph for ad accounts failed',data:{errorMessage:fallbackError instanceof Error ? fallbackError.message : 'unknown_error'},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }
    }
    throw buildStepError('setup', firstTry.error, 'Nao foi possivel carregar contas de anuncios.')
  }
  const accounts = (firstTry.data?.accounts as AdAccount[]) || []
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-setup-adaccounts',hypothesisId:'H14',location:'metaApi.ts:fetchAdAccounts:success',message:'meta-ad-accounts edge call succeeded',data:{adAccountsCount:accounts.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return accounts
}

export async function fetchIgAccountsForAdAccount(
  accessToken: string,
  adAccountId: string,
): Promise<IgAccountMapping[]> {
  const authOptions = await getRequiredAuthInvokeOptions('setup')
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-identity-ig',hypothesisId:'H1',location:'metaApi.ts:fetchIgAccountsForAdAccount:invoke',message:'invoking get_ig_accounts',data:{hasMetaAccessToken:Boolean(accessToken),hasAuthHeader:Boolean(authOptions.headers?.Authorization),adAccountIdSuffix:adAccountId.slice(-8)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const { data, error } = await supabase.functions.invoke('meta-ad-accounts', {
    ...authOptions,
    body: { access_token: accessToken, action: 'get_ig_accounts', ad_account_id: adAccountId },
  })
  if (error) {
    const details = extractFunctionErrorDebugData(error)
    // #region agent log
    fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-identity-ig',hypothesisId:'H2',location:'metaApi.ts:fetchIgAccountsForAdAccount:error',message:'get_ig_accounts failed',data:{contextStatus:details.contextStatus,contextCode:details.contextCode,contextMessage:details.contextMessage,errorMessage:details.errorMessage},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (details.contextStatus === 401) {
      try {
        const fallback = await fetchIgAccountsForAdAccountDirect(accessToken, adAccountId)
        // #region agent log
        fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-identity-ig',hypothesisId:'H3',location:'metaApi.ts:fetchIgAccountsForAdAccount:fallbackDirect:success',message:'fallback direct graph for get_ig_accounts succeeded',data:{igAccountsCount:fallback.length,adAccountIdSuffix:adAccountId.slice(-8)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return fallback
      } catch (fallbackError) {
        // #region agent log
        fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-identity-ig',hypothesisId:'H3',location:'metaApi.ts:fetchIgAccountsForAdAccount:fallbackDirect:error',message:'fallback direct graph for get_ig_accounts failed',data:{errorMessage:fallbackError instanceof Error ? fallbackError.message : 'unknown_error',adAccountIdSuffix:adAccountId.slice(-8)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }
    }
    throw buildStepError('setup', error, 'Nao foi possivel carregar identidade da conta.')
  }
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-identity-ig',hypothesisId:'H3',location:'metaApi.ts:fetchIgAccountsForAdAccount:success',message:'get_ig_accounts succeeded',data:{igAccountsCount:Array.isArray(data?.ig_accounts)?data.ig_accounts.length:0},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return (data?.ig_accounts as IgAccountMapping[]) || []
}

export async function fetchAudiences(accessToken: string, adAccountId: string): Promise<Audience[]> {
  const authOptions = await getRequiredAuthInvokeOptions('audience')
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-audience',hypothesisId:'H15',location:'metaApi.ts:fetchAudiences:invoke',message:'invoking meta-audiences',data:{hasMetaAccessToken:Boolean(accessToken),hasAuthHeader:Boolean(authOptions.headers?.Authorization),adAccountIdSuffix:adAccountId.slice(-8)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const { data, error } = await supabase.functions.invoke('meta-audiences', {
    ...authOptions,
    body: { access_token: accessToken, ad_account_id: adAccountId },
  })
  if (error) {
    const details = extractFunctionErrorDebugData(error)
    // #region agent log
    fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-audience',hypothesisId:'H16',location:'metaApi.ts:fetchAudiences:error',message:'meta-audiences failed',data:{contextStatus:details.contextStatus,contextCode:details.contextCode,contextMessage:details.contextMessage,errorMessage:details.errorMessage,adAccountIdSuffix:adAccountId.slice(-8)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (details.contextStatus === 401) {
      try {
        const fallback = await fetchAudiencesFromMetaDirect(accessToken, adAccountId)
        // #region agent log
        fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-audience',hypothesisId:'H21',location:'metaApi.ts:fetchAudiences:fallbackDirect:success',message:'fallback direct graph for audiences succeeded',data:{audiencesCount:fallback.length,adAccountIdSuffix:adAccountId.slice(-8)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return fallback
      } catch (fallbackError) {
        // #region agent log
        fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-audience',hypothesisId:'H21',location:'metaApi.ts:fetchAudiences:fallbackDirect:error',message:'fallback direct graph for audiences failed',data:{errorMessage:fallbackError instanceof Error ? fallbackError.message : 'unknown_error',adAccountIdSuffix:adAccountId.slice(-8)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }
    }
    throw buildStepError('audience', error, 'Nao foi possivel carregar publicos.')
  }
  const audiences = (data?.audiences as Audience[]) || []
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-audience',hypothesisId:'H17',location:'metaApi.ts:fetchAudiences:success',message:'meta-audiences succeeded',data:{audiencesCount:audiences.length,adAccountIdSuffix:adAccountId.slice(-8)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return audiences
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
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-whatsapp',hypothesisId:'H18',location:'metaApi.ts:fetchWhatsAppNumbers:invoke',message:'invoking meta-whatsapp-numbers',data:{hasMetaAccessToken:Boolean(accessToken),hasAuthHeader:Boolean(authOptions.headers?.Authorization),adAccountIdSuffix:adAccountId?.slice(-8) ?? null,hasPageId:Boolean(pageId)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const { data, error } = await supabase.functions.invoke('meta-whatsapp-numbers', {
    ...authOptions,
    body: { access_token: accessToken, ad_account_id: adAccountId, page_id: pageId },
  })
  if (error) {
    const details = extractFunctionErrorDebugData(error)
    // #region agent log
    fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-whatsapp',hypothesisId:'H19',location:'metaApi.ts:fetchWhatsAppNumbers:error',message:'meta-whatsapp-numbers failed',data:{contextStatus:details.contextStatus,contextCode:details.contextCode,contextMessage:details.contextMessage,errorMessage:details.errorMessage,adAccountIdSuffix:adAccountId?.slice(-8) ?? null,hasPageId:Boolean(pageId)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (details.contextStatus === 401) {
      try {
        const fallback = await fetchWhatsAppNumbersFromMetaDirect(accessToken, pageId)
        // #region agent log
        fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-whatsapp',hypothesisId:'H22',location:'metaApi.ts:fetchWhatsAppNumbers:fallbackDirect:success',message:'fallback direct graph for whatsapp numbers succeeded',data:{numbersCount:fallback.length,adAccountIdSuffix:adAccountId?.slice(-8) ?? null,hasPageId:Boolean(pageId)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return fallback
      } catch (fallbackError) {
        // #region agent log
        fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-whatsapp',hypothesisId:'H22',location:'metaApi.ts:fetchWhatsAppNumbers:fallbackDirect:error',message:'fallback direct graph for whatsapp numbers failed',data:{errorMessage:fallbackError instanceof Error ? fallbackError.message : 'unknown_error',adAccountIdSuffix:adAccountId?.slice(-8) ?? null,hasPageId:Boolean(pageId)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }
    }
    throw buildStepError('fase3', error, 'Nao foi possivel carregar numeros de WhatsApp.')
  }
  const numbers = (data?.numbers as WhatsAppNumber[]) || []
  // #region agent log
  fetch('http://127.0.0.1:7576/ingest/113f4891-06e6-453c-a145-e7092df6beff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d588f'},body:JSON.stringify({sessionId:'7d588f',runId:'run-whatsapp',hypothesisId:'H20',location:'metaApi.ts:fetchWhatsAppNumbers:success',message:'meta-whatsapp-numbers succeeded',data:{numbersCount:numbers.length,adAccountIdSuffix:adAccountId?.slice(-8) ?? null,hasPageId:Boolean(pageId)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return numbers
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
