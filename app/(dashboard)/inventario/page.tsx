import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RecibimientoForm } from './_components/recibimiento-form'
import { HistorialDeleteButton } from './_components/historial-delete-button'
import { Package, TrendingUp, Calendar, FileDown } from 'lucide-react'

type RecibimientoItem = { tipo: string; kilos: number; precio_kg: number; subtotal: number; descripcion?: string }

export default async function InventarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: hoy } = await supabase
    .from('recibimientos')
    .select('*, recibimiento_items(*)')
    .eq('fecha', today)
    .single()

  const { data: historial } = await supabase
    .from('recibimientos')
    .select('*, recibimiento_items(*)')
    .order('fecha', { ascending: false })
    .limit(14)

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const { data: semana } = await supabase
    .from('recibimientos')
    .select('total_dia')
    .gte('fecha', weekStart)
    .lte('fecha', weekEnd)

  const totalSemana = semana?.reduce((a, r) => a + (r.total_dia ?? 0), 0) ?? 0

  const findItem = (tipo: string) =>
    (hoy?.recibimiento_items as RecibimientoItem[] | undefined)?.find((i) => i.tipo === tipo)

  const otrasItem = findItem('otras')

  const existing = hoy
    ? {
        fecha: hoy.fecha,
        menudencia_kilos: findItem('menudencia')?.kilos ?? 0,
        menudencia_precio: findItem('menudencia')?.precio_kg ?? 0,
        seara_kilos: findItem('seara')?.kilos ?? 0,
        seara_precio: findItem('seara')?.precio_kg ?? 0,
        pollo_kilos: findItem('pollo')?.kilos ?? 0,
        pollo_precio: findItem('pollo')?.precio_kg ?? 0,
        otras_monto: otrasItem?.subtotal ?? 0,
        otras_descripcion: otrasItem?.descripcion ?? '',
      }
    : undefined

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">
          {formatDate(new Date())}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-red-500" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hoy</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(hoy?.total_dia ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Esta semana</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSemana)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Registros</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{historial?.length ?? 0} días</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          {hoy ? '✏️ Editar recibimiento de hoy' : '📋 Registrar recibimiento de hoy'}
        </h2>
        <RecibimientoForm fecha={today} existing={existing} />
      </div>

      {/* Historial */}
      {historial && historial.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Historial reciente
          </h2>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="divide-y">
              {historial.map((rec) => {
                const items = (rec.recibimiento_items ?? []) as RecibimientoItem[]
                const fechaLabel = format(parseISO(rec.fecha), "EEEE d 'de' MMMM", { locale: es })
                return (
                  <div key={rec.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {fechaLabel}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {items
                          .filter((i) => i.subtotal > 0)
                          .map((i) =>
                            i.tipo === 'otras'
                              ? `${i.descripcion ?? 'Otras'}: ${formatCurrency(i.subtotal)}`
                              : `${i.tipo}: ${i.kilos}kg`
                          )
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(rec.total_dia)}</p>
                      <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs" asChild>
                        <a href={`/api/inventario/pdf?fecha=${rec.fecha}`} target="_blank" rel="noopener noreferrer">
                          <FileDown className="h-3 w-3" />PDF
                        </a>
                      </Button>
                      <HistorialDeleteButton id={rec.id} fecha={fechaLabel} />
                    </div>
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
