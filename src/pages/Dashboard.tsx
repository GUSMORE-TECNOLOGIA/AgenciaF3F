import { useAuth } from '@/contexts/AuthContext'
import { Users, Briefcase, DollarSign, AlertCircle } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()

  const stats = [
    { label: 'Clientes Ativos', value: '0', icon: Users, color: 'text-blue-600' },
    { label: 'Serviços Ativos', value: '0', icon: Briefcase, color: 'text-green-600' },
    { label: 'Receita do Mês', value: 'R$ 0,00', icon: DollarSign, color: 'text-yellow-600' },
    { label: 'Ocorrências Abertas', value: '0', icon: AlertCircle, color: 'text-red-600' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-foreground mb-4">Bem-vindo ao sistema!</h2>
        <p className="text-gray-600">
          Olá, {user?.name}! Este é o sistema de gestão de clientes e serviços da Agência F3F.
        </p>
      </div>
    </div>
  )
}
