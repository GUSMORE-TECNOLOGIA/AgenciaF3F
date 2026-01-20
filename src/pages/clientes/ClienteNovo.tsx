import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import ClienteForm from './components/ClienteForm'
import LinksUteisEditor from './components/LinksUteisEditor'
import { useCreateCliente } from '@/hooks/useCliente'
import { ClienteCreateInput, ClienteUpdateInput } from '@/lib/validators/cliente-schema'
import { LinksUteis } from '@/types'

export default function ClienteNovo() {
  const navigate = useNavigate()
  const { create, loading } = useCreateCliente()
  const [linksUteis, setLinksUteis] = useState<LinksUteis>({})

  const handleSubmit = async (data: ClienteCreateInput | ClienteUpdateInput) => {
    try {
      // No modo create, garantimos que todos os campos obrigatórios estão presentes
      const clienteData: ClienteCreateInput = {
        ...(data as ClienteCreateInput),
        links_uteis: Object.keys(linksUteis).length > 0 ? linksUteis : undefined,
      }
      const cliente = await create(clienteData)
      navigate(`/clientes/${cliente.id}`)
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      throw error
    }
  }

  return (
    <div>
      <Link
        to="/clientes"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para lista
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Novo Cliente</h1>
        <p className="text-gray-600">Preencha os dados para criar um novo cliente</p>
      </div>

      <div className="space-y-6">
        {/* Formulário Principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Dados do Cliente</h2>
          <ClienteForm
            mode="create"
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>

        {/* Editor de Links Úteis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <LinksUteisEditor
            links={linksUteis}
            onSave={async (links) => {
              setLinksUteis(links)
            }}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
