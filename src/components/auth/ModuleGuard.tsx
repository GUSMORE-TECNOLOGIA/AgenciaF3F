import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { ModuloSistema } from '@/types'

type AcaoModulo = 'visualizar' | 'editar' | 'excluir'

interface ModuleGuardProps {
  modulo: ModuloSistema
  acao?: AcaoModulo
  children: React.ReactNode
  /** Rota para onde redirecionar quando sem permissão. Default: /dashboard */
  redirectTo?: string
}

/**
 * Protege conteúdo por permissão do módulo.
 * Se o usuário não tiver a permissão (ex.: visualizar no módulo financeiro), redireciona.
 */
export function ModuleGuard({
  modulo,
  acao = 'visualizar',
  children,
  redirectTo = '/dashboard',
}: ModuleGuardProps) {
  const { pode, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!pode(modulo, acao)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
