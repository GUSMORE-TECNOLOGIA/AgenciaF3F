/**
 * Log de debug. Em dev: envia para .cursor/debug.log (Vite) e grava em localStorage como fallback.
 * Ver logs: .cursor/debug.log OU no console: localStorage.getItem('debug_log') OU window.__DEBUG_LOG_LINES__
 */
const DEBUG_LOG_TAG = 'perfil-update'
const LOCALSTORAGE_KEY = 'debug_log'

function ensureWindowLog(): unknown[] {
  if (typeof window === 'undefined') return []
  const w = window as unknown as { __DEBUG_LOG_LINES__?: unknown[] }
  if (!Array.isArray(w.__DEBUG_LOG_LINES__)) w.__DEBUG_LOG_LINES__ = []
  return w.__DEBUG_LOG_LINES__
}

function appendToLocalStorage(payload: object): void {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY) || '[]'
    const arr = JSON.parse(raw) as unknown[]
    arr.push(payload)
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(arr))
  } catch (_) {}
}

export function debugLog(tag: string, data: Record<string, unknown>): void {
  const payload = { ts: Date.now(), tag, ...data }
  console.log(`[${tag}]`, data)
  const lines = ensureWindowLog()
  lines.push(payload)
  appendToLocalStorage(payload)
  if (import.meta.env.DEV) {
    try {
      fetch('/__debug_log__', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    } catch (_) {}
  }
}

/** Atalho para logs do fluxo perfil-update */
export function perfilUpdateLog(step: string, data: Record<string, unknown>): void {
  debugLog(DEBUG_LOG_TAG, { step, ...data })
}
