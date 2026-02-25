import { Cliente } from '@/types'
import ClienteLinksManager from '../ClienteLinksManager'

interface LinksUteisTabProps {
  cliente: Cliente
  onSave?: () => void
}

export default function LinksUteisTab({ cliente, onSave }: LinksUteisTabProps) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6">
        <ClienteLinksManager clienteId={cliente.id} onSave={onSave} />
      </div>
    </div>
  )
}
