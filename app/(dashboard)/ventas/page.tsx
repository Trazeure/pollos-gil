import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { VentaForm } from './_components/venta-form'
import { TrendingUp } from 'lucide-react'

export default async function VentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: productos }, { data: historial }] = await Promise.all([
    supabase.from('productos').select('*').eq('activo', true).order('categoria').order('nombre'),
    supabase
      .from('ventas')
      .select('*')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const today = format(new Date(), 'yyyy-MM-dd')
  const ventasHoy = historial?.filter((v) => v.fecha === today) ?? []
  const totalHoy = ventasHoy.reduce((s, v) => s + (v.total ?? 0), 0)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">{formatDate(new Date())}</p>
      </div>

      {/* Stat de hoy */}
      {totalHoy > 0 && (
        <Card className="border-0 shadow-sm bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Ventas de hoy</p>
              <p className="text-2xl font-black text-green-800">{formatCurrency(totalHoy)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Registrar ventas del día
        </h2>
        <VentaForm productos={productos ?? []} />
      </div>

      {/* Historial */}
      {historial && historial.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Últimas ventas registradas
          </h2>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="divide-y">
              {historial.map((venta) => {
                const items = (venta.items as {producto_nombre: string; cantidad: number}[]) ?? []
                return (
                  <div key={venta.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {format(parseISO(venta.fecha), "EEEE d 'de' MMMM", { locale: es })}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                        {items.slice(0, 3).map((i) => `${i.producto_nombre} ×${i.cantidad}`).join(' · ')}
                        {items.length > 3 && ` +${items.length - 3} más`}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 shrink-0 ml-3">
                      {formatCurrency(venta.total)}
                    </p>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
