import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'
import { User } from '@/types'
import type { PerfilPermissao, ModuloSistema } from '@/types'
import { fetchPermissoesByPerfil, fetchPermissoesUsuario, fetchPerfis } from '@/services/perfis'

type AcaoPermissao = 'visualizar' | 'editar' | 'excluir'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  mustResetPassword: boolean
  /** Permissões do perfil do usuário (por módulo). */
  permissoes: PerfilPermissao[]
  /** Verifica se o usuário pode executar a ação no módulo. Admin (role='admin') tem tudo. */
  pode: (modulo: ModuloSistema, acao: AcaoPermissao) => boolean
  refreshProfile: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [mustResetPassword, setMustResetPassword] = useState(false)
  const [permissoes, setPermissoes] = useState<PerfilPermissao[]>([])

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
        setMustResetPassword(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function createUserProfileFromAuth(authUser: SupabaseUser) {
    try {
      const payload = {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.email?.split('@')[0] || 'Usuário',
        role: 'user',
        perfil: 'agente',
        must_reset_password: true,
      }

      const { data, error } = await supabase
        .from('usuarios')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar perfil do usuário:', error)
        return null
      }

      return data as User
    } catch (error) {
      console.error('Erro ao criar perfil do usuário:', error)
      return null
    }
  }

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
            const createdProfile = await createUserProfileFromAuth(authUser.user)
            if (createdProfile) {
              setUser(createdProfile)
              setMustResetPassword(true)
            } else {
              const basicUser: User = {
                id: authUser.user.id,
                email: authUser.user.email || '',
                name: authUser.user.email?.split('@')[0] || 'Usuário',
                role: 'user',
                perfil: 'agente',
                must_reset_password: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
              setUser(basicUser)
              setMustResetPassword(true)
            }
          }
        } else {
          throw error
        }
      } else {
        setUser(data)
        setMustResetPassword(!!data.must_reset_password)
        // Carregar permissões do perfil (perfil_id ou perfil por slug)
        loadPermissoes(data).catch((err) => {
          console.warn('Permissões não carregadas:', err)
          setPermissoes([])
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPermissoes(userData: User) {
    if (userData.perfil_id) {
      const perms = await fetchPermissoesUsuario(userData.id)
      setPermissoes(perms)
      return
    }
    const perfis = await fetchPerfis()
    const p = perfis.find((x) => x.slug === userData.perfil) ?? perfis.find((x) => x.slug === 'agente')
    if (p) {
      const perms = await fetchPermissoesByPerfil(p.id)
      setPermissoes(perms)
    } else {
      setPermissoes([])
    }
  }

  async function refreshProfile() {
    if (!supabaseUser) return
    setLoading(true)
    await loadUserProfile(supabaseUser.id)
  }

  function setMinimalUserFromAuth(authUser: SupabaseUser) {
    setUser({
      id: authUser.id,
      email: authUser.email ?? '',
      name: authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? 'Usuário',
      role: 'user',
      perfil: 'agente',
      must_reset_password: true,
      created_at: authUser.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setMustResetPassword(true)
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }
    if (data.user) {
      const u = data.user
      setMinimalUserFromAuth(u)
      setLoading(false)
      // Carregar perfil completo em background; se falhar (ex.: "Database error querying schema"),
      // o usuário já está dentro com perfil mínimo.
      loadUserProfile(u.id).catch((profileErr) => {
        console.warn('Perfil não carregado do banco, mantendo perfil mínimo:', profileErr)
      })
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setSupabaseUser(null)
    setMustResetPassword(false)
    setPermissoes([])
  }

  const pode = useMemo(() => {
    return (modulo: ModuloSistema, acao: AcaoPermissao): boolean => {
      if (user?.role === 'admin') return true
      const p = permissoes.find((x) => x.modulo === modulo)
      if (!p) return false
      if (acao === 'visualizar') return p.pode_visualizar
      if (acao === 'editar') return p.pode_editar
      return p.pode_excluir
    }
  }, [user?.role, permissoes])

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        loading,
        mustResetPassword,
        permissoes,
        pode,
        refreshProfile,
        signIn,
        signOut,
      }}
    >
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
