import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, parseISO, addMonths, subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: { mes?: string; anio?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const anio = Number(searchParams.anio) || now.getFullYear()
  const mes = Number(searchParams.mes) || now.getMonth() + 1
  const base = new Date(anio, mes - 1, 1)

  const monthStart = startOfMonth(base)
  const monthEnd = endOfMonth(base)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const desde = format(monthStart, 'yyyy-MM-dd')
  const hasta = format(monthEnd, 'yyyy-MM-dd')

  const [{ data: ventas }, { data: recibimientos }, { data: pedidos }] = await Promise.all([
    supabase.from('ventas').select('fecha, total').gte('fecha', desde).lte('fecha', hasta),
    supabase.from('recibimientos').select('fecha, total_dia').gte('fecha', desde).lte('fecha', hasta),
    supabase.from('pedidos').select('fecha_entrega, estado, cliente').gte('fecha_entrega', desde).lte('fecha_entrega', hasta).not('fecha_entrega', 'is', null),
  ])

  // Build maps
  const ventaMap: Record<string, number> = {}
  ventas?.forEach(v => { ventaMap[v.fecha] = (ventaMap[v.fecha] ?? 0) + v.total })

  const recMap: Record<string, number> = {}
  recibimientos?.forEach(r => { recMap[r.fecha] = r.total_dia })

  const pedidoMap: Record<string, { cliente: string; estado: string }[]> = {}
  pedidos?.forEach(p => {
    if (!p.fecha_entrega) return
    if (!pedidoMap[p.fecha_entrega]) pedidoMap[p.fecha_entrega] = []
    pedidoMap[p.fecha_entrega].push({ cliente: p.cliente, estado: p.estado })
  })

  const prevMes = subMonths(base, 1)
  const nextMes = addMonths(base, 1)
  const prevUrl = `/calendario?mes=${prevMes.getMonth() + 1}&anio=${prevMes.getFullYear()}`
  const nextUrl = `/calendario?mes=${nextMes.getMonth() + 1}&anio=${nextMes.getFullYear()}`
  const titulo = format(base, "MMMM yyyy", { locale: es })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 capitalize">{titulo}</h1>
        <div className="flex items-center gap-2">
          <Link href={prevUrl} className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <Link href="/calendario" className="h-9 px-3 flex items-center rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors">
            Hoy
          </Link>
          <Link href={nextUrl} className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </Link>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />Venta registrada</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />Recibimiento</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-yellow-500 inline-block" />Entrega pendiente</span>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {DIAS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key = format(day, 'yyyy-MM-dd')
            const hasVenta = !!ventaMap[key]
            const hasRec = !!recMap[key]
            const hasPedido = !!pedidoMap[key]
            const isCurrentMonth = isSameMonth(day, base)
            const isHoy = isToday(day)
            const isLast = i === days.length - 1
            const isLastRow = i >= days.length - 7

            return (
              <div
                key={key}
                className={cn(
                  'min-h-[80px] p-2 border-b border-r transition-colors',
                  !isCurrentMonth && 'bg-gray-50/50',
                  isHoy && 'bg-red-50',
                  isLastRow && 'border-b-0',
                  (i + 1) % 7 === 0 && 'border-r-0',
                )}
              >
                {/* Day number */}
                <div className={cn(
                  'text-sm font-semibold mb-1.5 w-7 h-7 flex items-center justify-center rounded-full',
                  isHoy ? 'bg-red-600 text-white' : isCurrentMonth ? 'text-gray-800' : 'text-gray-300',
                )}>
                  {format(day, 'd')}
                </div>

                {/* Indicators */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {hasVenta && <span className="h-2 w-2 rounded-full bg-green-500" title="Venta" />}
                  {hasRec && <span className="h-2 w-2 rounded-full bg-blue-500" title="Recibimiento" />}
                  {hasPedido && <span className="h-2 w-2 rounded-full bg-yellow-500" title="Entrega" />}
                </div>

                {/* Amounts */}
                {isCurrentMonth && (
                  <div className="space-y-0.5">
                    {hasVenta && (
                      <p className="text-xs text-green-700 font-medium leading-none">
                        {formatCurrency(ventaMap[key])}
                      </p>
                    )}
                    {pedidoMap[key]?.slice(0, 1).map((p, pi) => (
                      <p key={pi} className="text-xs text-yellow-700 leading-none truncate">
                        {p.cliente}
                      </p>
                    ))}
                    {(pedidoMap[key]?.length ?? 0) > 1 && (
                      <p className="text-xs text-gray-400">+{(pedidoMap[key]?.length ?? 0) - 1}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Ventas del mes</p>
          <p className="text-xl font-black text-green-800">{formatCurrency(Object.values(ventaMap).reduce((a, b) => a + b, 0))}</p>
          <p className="text-xs text-green-500 mt-0.5">{Object.keys(ventaMap).length} días</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Gasto inventario</p>
          <p className="text-xl font-black text-blue-800">{formatCurrency(Object.values(recMap).reduce((a, b) => a + b, 0))}</p>
          <p className="text-xs text-blue-500 mt-0.5">{Object.keys(recMap).length} recibimientos</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-xs text-yellow-600 font-semibold uppercase tracking-wide mb-1">Entregas pendientes</p>
          <p className="text-xl font-black text-yellow-800">{Object.values(pedidoMap).reduce((a, b) => a + b.length, 0)}</p>
          <p className="text-xs text-yellow-500 mt-0.5">pedidos</p>
        </div>
      </div>
    </div>
  )
}
