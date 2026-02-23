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
  /** True se o usuário pode editar valor e datas em planos/serviços (admin ou perfil financeiro). */
  canSuperEditPlanos: boolean
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
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setLoading(false)
      }
    }, 15000)

    // Verificar sessão atual
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return
        setSupabaseUser(session?.user ?? null)
        if (session?.user) {
          loadUserProfile(session.user.id)
        } else {
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Erro ao verificar sessão:', err)
        if (!cancelled) setLoading(false)
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

    return () => {
      cancelled = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
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
      const { data: raw, error } = await supabase
        .from('usuarios')
        .select('id, email, name, role, perfil, perfil_id, must_reset_password, password_reset_at, created_at, updated_at, perfis(slug)')
        .eq('id', userId)
        .single()
      const data = raw as any
      const perfilSlug = data?.perfis?.slug ?? data?.perfil

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
        const userData: User = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          perfil: (perfilSlug ?? data.perfil ?? 'agente') as User['perfil'],
          perfil_id: data.perfil_id ?? undefined,
          must_reset_password: !!data.must_reset_password,
          password_reset_at: data.password_reset_at || undefined,
          created_at: data.created_at,
          updated_at: data.updated_at,
        }
        setUser(userData)
        setMustResetPassword(!!data.must_reset_password)
        // Carregar permissões do perfil (perfil_id ou perfil por slug)
        loadPermissoes(userData).catch((err) => {
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
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('signOut API falhou (sessão já inválida ou 403):', e)
    }
    // Sempre limpar estado local para o usuário conseguir sair mesmo com 403/sessão ausente
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

  const canSuperEditPlanos = Boolean(
    user && (user.role === 'admin' || user.perfil === 'financeiro')
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        loading,
        mustResetPassword,
        permissoes,
        pode,
        canSuperEditPlanos,
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
