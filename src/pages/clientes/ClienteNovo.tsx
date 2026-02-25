import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import ClienteForm from './components/ClienteForm'
import { useCreateCliente } from '@/hooks/useCliente'
import { ClienteCreateInput, ClienteUpdateInput } from '@/lib/validators/cliente-schema'

export default function ClienteNovo() {
  const navigate = useNavigate()
  const { create, loading } = useCreateCliente()

  const handleSubmit = async (data: ClienteCreateInput | ClienteUpdateInput) => {
    try {
      const cliente = await create(data as ClienteCreateInput)
      navigate(`/clientes/${cliente.id}/editar`)
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      throw error
    }
  }

  return (
    <div>
      <Link
        to="/clientes"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para lista
      </Link>

      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Novo Cliente</h1>
        <p className="text-muted-foreground">Preencha os dados para criar um novo cliente</p>
      </div>

      <div className="space-y-6">
        {/* Formulário Principal */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Dados do Cliente</h2>
          <ClienteForm
            mode="create"
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>

        {/* Informação sobre Links Úteis */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Dica:</strong> Após criar o cliente, você poderá adicionar links úteis (Instagram, Facebook, Dashboards, etc.) na página de edição do cliente, na aba "Links".
          </p>
        </div>
      </div>
    </div>
  )
}
