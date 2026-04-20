import PagePlaceholder from '@/components/shared/page-placeholder'
import { Calendar } from 'lucide-react'

export default function CalendarioPage() {
  return (
    <PagePlaceholder
      title="Calendario"
      description="Eventos, pagos pendientes y entregas programadas"
      icon={Calendar}
    />
  )
}
