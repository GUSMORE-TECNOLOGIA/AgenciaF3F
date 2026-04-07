export interface MetaOAuthCallbackResponse {
  access_token: string
  expires_in: number
  is_long_lived: boolean
  saved_to_db: boolean
}

export interface MetaStatusResponse {
  connected: boolean
  access_token?: string
  meta_name?: string
  expires_at?: string
  expires_soon?: boolean
  reason?: string
  error?: string
}

export interface AdAccount {
  id: string
  name: string
}

export interface IgAccountMapping {
  ig_account_id: string
  ig_username: string | null
  page_id: string | null
  page_name: string | null
  waba_phone_id: string | null
  waba_phone: string | null
}

export interface Audience {
  id: string
  name: string
  type: 'custom' | 'saved'
  targeting_spec?: Record<string, unknown> | null
}

export interface Campaign {
  id: string
  name: string
  status: string
  objective?: string
  created_time?: string
}

export interface WhatsAppNumber {
  id: string
  display: string
  phone: string
  page_id: string
  page_name: string
}

export interface LocationResult {
  key: string
  name: string
  type: string
  country_code: string
  country_name: string
  region?: string
  display: string
}

export interface PublishLog {
  step: string
  status: 'start' | 'success' | 'error'
  ts: string
  detail?: string
}

export interface PublishResponse {
  ok?: boolean
  campaign_id?: string
  adset_id?: string
  ad_id?: string
  adset_ids?: string[]
  ad_ids?: string[]
  adsets_created?: number
  creatives_created?: number
  ads_created?: number
  warning?: boolean
  step?: string
  error?: string
  error_message?: string
  error_code?: number | string | null
  error_subcode?: number | string | null
  error_user_msg?: string
  error_user_title?: string
  raw_error?: unknown
  failures?: Array<{ index: number; name: string; step: string; reason: string }>
  logs?: PublishLog[]
}

export interface ValidationResponse {
  ok: boolean
  error?: string
  suggest_drive?: boolean
  [key: string]: unknown
}
export type DiagnosticResponse = Record<string, unknown>
