import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Ouvir mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Se a tabela não existe ou usuário não tem perfil, criar um básico
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.warn('Tabela usuarios não encontrada ou usuário sem perfil. Execute as migrations.')
          // Criar perfil básico temporário
          const { data: authUser } = await supabase.auth.getUser()
          if (authUser?.user) {
            const basicUser: User = {
              id: authUser.user.id,
              email: authUser.user.email || '',
              name: authUser.user.email?.split('@')[0] || 'Usuário',
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            setUser(basicUser)
          }
        } else {
          throw error
        }
      } else {
        setUser(data)
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/7a35c8fc-ab06-4c43-ab6f-f3c55593c010',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:86',message:'signIn called',data:{email,passwordLength:password.length,supabaseUrl:import.meta.env.VITE_SUPABASE_URL?.substring(0,30)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/7a35c8fc-ab06-4c43-ab6f-f3c55593c010',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:92',message:'signInWithPassword response',data:{hasData:!!data,hasError:!!error,errorCode:error?.code,errorMessage:error?.message,userId:data?.user?.id,userEmail:data?.user?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (error) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/7a35c8fc-ab06-4c43-ab6f-f3c55593c010',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:95',message:'signIn error details',data:{errorCode:error.code,errorMessage:error.message,errorStatus:error.status,fullError:JSON.stringify(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw error
    }
    if (data.user) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/7a35c8fc-ab06-4c43-ab6f-f3c55593c010',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:100',message:'User authenticated, loading profile',data:{userId:data.user.id,userEmail:data.user.email,emailConfirmed:data.user.email_confirmed_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      await loadUserProfile(data.user.id)
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setSupabaseUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
