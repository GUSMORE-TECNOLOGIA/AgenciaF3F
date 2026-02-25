import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { LogIn } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err?.message ?? 'Erro ao fazer login'
      if (msg.toLowerCase().includes('database error querying schema')) {
        setError(
          'Problema temporário de conexão. Tente novamente em instantes ou contate o administrador.'
        )
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const emailToUse = email.trim()
    if (!emailToUse) {
      setError('Informe seu e-mail para redefinir a senha.')
      return
    }
    setForgotLoading(true)
    try {
      const redirectTo = `${window.location.origin}/alterar-senha`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailToUse, { redirectTo })
      if (resetError) throw resetError
      setForgotSent(true)
    } catch (err: any) {
      const raw = err?.message ?? 'Erro ao enviar e-mail. Tente novamente.'
      const isRateLimit = String(raw).toLowerCase().includes('rate limit')
      setError(
        isRateLimit
          ? 'Muitas solicitações de e-mail no momento. O provedor de autenticação limita envios por hora. Tente novamente em alguns minutos ou peça ao administrador para reenviar o link mais tarde.'
          : raw
      )
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Agência F3F</h1>
          <p className="text-muted-foreground">Gestão de Clientes e Serviços</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="seu@email.com"
            />
          </div>

          {!forgotPassword && (
            <>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Senha
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

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setForgotPassword(true); setError(''); setForgotSent(false); }}
                  className="text-sm text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </>
          )}

          {forgotPassword && (
            <div className="rounded-lg bg-muted border border-border p-4 space-y-3">
              {!forgotSent ? (
                <>
                  <p className="text-sm text-foreground">
                    Informe seu e-mail. Enviaremos um link para você redefinir sua senha.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={forgotLoading}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
                    >
                      {forgotLoading ? 'Enviando...' : 'Enviar link'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setForgotPassword(false); setError(''); }}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    Voltar ao login
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-green-700 font-medium">
                    Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Verifique sua caixa de entrada e o spam.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setForgotPassword(false); setForgotSent(false); }}
                    className="text-sm text-primary hover:underline"
                  >
                    Voltar ao login
                  </button>
                </>
              )}
            </div>
          )}

          {!forgotPassword && (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
