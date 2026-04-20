import PagePlaceholder from '@/components/shared/page-placeholder'
import { ClipboardList } from 'lucide-react'

export default function PedidosPage() {
  return (
    <PagePlaceholder
      title="Pedidos"
      description="Gestión de pedidos — pagados, pendientes y a deber"
      icon={ClipboardList}
    />
  )
}
