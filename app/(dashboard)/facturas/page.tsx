import PagePlaceholder from '@/components/shared/page-placeholder'
import { FileText } from 'lucide-react'

export default function FacturasPage() {
  return (
    <PagePlaceholder
      title="Facturas"
      description="Generar facturas PDF y compartir por WhatsApp"
      icon={FileText}
    />
  )
}
