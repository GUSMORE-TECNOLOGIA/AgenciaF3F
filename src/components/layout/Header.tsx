import { Sun, Moon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

export default function Header() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Bem-vindo, {user?.name || 'Usuário'}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}
