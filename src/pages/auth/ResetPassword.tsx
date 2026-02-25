import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function ResetPassword() {
  const { user, mustResetPassword, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!password || password.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.')
      return
    }

    try {
      setLoading(true)
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      if (user) {
        const { error: profileError } = await supabase
          .from('usuarios')
          .update({
            must_reset_password: false,
            password_reset_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (profileError) {
          console.error('Erro ao atualizar perfil:', profileError)
        }
      }

      await refreshProfile()
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err)
      setError(err?.message || 'Erro ao redefinir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">
            {mustResetPassword ? 'Atualize sua senha' : 'Alterar senha'}
          </h1>
          <p className="text-muted-foreground">
            {mustResetPassword
              ? 'Primeiro acesso detectado. Por segurança, defina uma nova senha.'
              : 'Defina uma nova senha para sua conta.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Nova senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
              Confirmar nova senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" />
            {loading ? 'Salvando...' : 'Atualizar senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
