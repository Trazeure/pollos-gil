import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { ShoppingCart } from 'lucide-react'
import { SugerenciasInventarioClient } from './_components/sugerencias-inventario-client'

export default async function SugerenciasInventarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const tomorrow = addDays(now, 1)
  const fechaMañana = format(tomorrow, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 bg-red-100 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
          <ShoppingCart className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras Inteligentes</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            ¿Qué comprar para mañana? · {fechaMañana}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">Cómo funciona este modelo</p>
        <ul className="text-blue-700 space-y-0.5 list-disc list-inside">
          <li>Analiza tus últimos 90 días de ventas por día de semana</li>
          <li>Detecta el efecto quincena (días 1, 15 y fondos de quincena)</li>
          <li>Consulta el clima actual de Monclova en tiempo real</li>
          <li>Verifica festivos mexicanos en los próximos 5 días</li>
          <li>Estima el stock restante basado en tu última compra</li>
        </ul>
      </div>

      <SugerenciasInventarioClient />
    </div>
  )
}
