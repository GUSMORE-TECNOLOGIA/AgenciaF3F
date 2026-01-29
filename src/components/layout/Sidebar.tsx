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

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/servicos', label: 'Serviços', icon: Briefcase },
  { path: '/planos', label: 'Planos', icon: Package },
  { path: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/ocorrencias', label: 'Ocorrências', icon: AlertCircle },
  { path: '/atendimento', label: 'Atendimento', icon: MessageSquare },
  { path: '/configuracoes/equipe', label: 'Equipe', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary">Agência F3F</h1>
        <p className="text-sm text-gray-500 mt-1">Gestão de Clientes</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link
          to="/alterar-senha"
          className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors ${
            location.pathname === '/alterar-senha'
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Lock className="w-5 h-5" />
          <span className="font-medium">Alterar senha</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  )
}
