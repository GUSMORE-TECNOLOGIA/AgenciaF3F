import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { user } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Bem-vindo, {user?.name || 'Usuário'}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}
