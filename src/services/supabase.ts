import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// #region agent log
if (typeof window !== 'undefined') {
  fetch('http://127.0.0.1:7246/ingest/7a35c8fc-ab06-4c43-ab6f-f3c55593c010',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.ts:3',message:'Supabase config check',data:{hasUrl:!!supabaseUrl,hasKey:!!supabaseAnonKey,urlLength:supabaseUrl?.length,keyLength:supabaseAnonKey?.length,urlPrefix:supabaseUrl?.substring(0,30)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
}
// #endregion

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Verifique o arquivo .env')
}

// Criar storage customizado que limpa dados antigos automaticamente
const customStorage = {
  getItem: (key: string) => {
    try {
      return window.localStorage.getItem(key)
    } catch (e) {
      console.warn('Erro ao ler localStorage:', e)
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      // Limpar dados antigos do Supabase se existirem
      if (key.includes('supabase') && value.length > 10000) {
        console.warn('Token muito grande detectado, limpando storage antigo...')
        // Limpar apenas chaves antigas do Supabase
        Object.keys(localStorage).forEach(k => {
          if (k.includes('supabase') && k !== key) {
            localStorage.removeItem(k)
          }
        })
      }
      window.localStorage.setItem(key, value)
    } catch (e) {
      console.warn('Erro ao escrever localStorage:', e)
      // Se o storage estiver cheio, limpar dados antigos
      if (e instanceof DOMException && e.code === 22) {
        console.warn('Storage cheio, limpando dados antigos...')
        Object.keys(localStorage).forEach(k => {
          if (k.includes('supabase') && k !== key) {
            localStorage.removeItem(k)
          }
        })
        try {
          window.localStorage.setItem(key, value)
        } catch (e2) {
          console.error('Não foi possível salvar no storage:', e2)
        }
      }
    }
  },
  removeItem: (key: string) => {
    try {
      window.localStorage.removeItem(key)
    } catch (e) {
      console.warn('Erro ao remover do localStorage:', e)
    }
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Usar storage customizado que gerencia melhor o espaço
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Não usar cookies para evitar headers grandes
    flowType: 'pkce',
  },
})
