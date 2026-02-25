import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Package,
  DollarSign,
  AlertCircle,
  MessageSquare,
  Settings,
  Lock,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import type { ModuloSistema } from '@/types'

const menuItems: { path: string; label: string; modulo: ModuloSistema; icon: typeof LayoutDashboard }[] = [
  { path: '/dashboard', label: 'Dashboard', modulo: 'dashboard', icon: LayoutDashboard },
  { path: '/clientes', label: 'Clientes', modulo: 'clientes', icon: Users },
  { path: '/servicos', label: 'Serviços', modulo: 'servicos', icon: Briefcase },
  { path: '/planos', label: 'Planos', modulo: 'planos', icon: Package },
  { path: '/financeiro', label: 'Financeiro', modulo: 'financeiro', icon: DollarSign },
  { path: '/ocorrencias', label: 'Ocorrências', modulo: 'ocorrencias', icon: AlertCircle },
  { path: '/atendimento', label: 'Atendimento', modulo: 'atendimento', icon: MessageSquare },
  { path: '/configuracoes/equipe', label: 'Equipe', modulo: 'equipe', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()
  const { signOut, pode } = useAuth()

  const itensVisiveis = menuItems.filter((item) => pode(item.modulo, 'visualizar'))

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-primary">Agência F3F</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão de Clientes</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {itensVisiveis.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-active text-sidebar-active-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-hover'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link
          to="/alterar-senha"
          className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors ${
            location.pathname === '/alterar-senha'
              ? 'bg-sidebar-active text-sidebar-active-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-hover'
          }`}
        >
          <Lock className="w-5 h-5" />
          <span className="font-medium">Alterar senha</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sidebar-foreground hover:bg-sidebar-hover transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  )
}
