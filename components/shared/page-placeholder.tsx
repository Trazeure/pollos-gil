import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface PagePlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
}

export default function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: PagePlaceholderProps) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="py-20 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Icon className="h-8 w-8 text-gray-300" />
          </div>
          <h2 className="text-base font-semibold text-gray-600 mb-2">
            Módulo en desarrollo
          </h2>
          <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
            Este módulo estará disponible próximamente. Estamos construyendo algo
            increíble para ti.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
