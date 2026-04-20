import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import { AnalyticsClient } from './_components/analytics-client'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const mesInicio = format(startOfMonth(now), 'yyyy-MM-dd')
  const mesFin = format(endOfMonth(now), 'yyyy-MM-dd')
  const hace30 = format(subDays(now, 30), 'yyyy-MM-dd')
  const hace8sem = format(subWeeks(now, 8), 'yyyy-MM-dd')

  const [{ data: ventasMes }, { data: ventas30 }, { data: inventarioMes }, { data: inventario8sem }] = await Promise.all([
    supabase.from('ventas').select('total').gte('fecha', mesInicio).lte('fecha', mesFin),
    supabase.from('ventas').select('fecha, items, total').gte('fecha', hace30).order('fecha'),
    supabase.from('recibimientos').select('total_dia').gte('fecha', mesInicio).lte('fecha', mesFin),
    supabase.from('recibimientos').select('fecha, total_dia').gte('fecha', hace8sem).order('fecha'),
  ])

  // Ventas por día
  const ventasPorDia: Record<string, number> = {}
  ventas30?.forEach(v => {
    ventasPorDia[v.fecha] = (ventasPorDia[v.fecha] ?? 0) + v.total
  })
  const ventasDiarias = Object.entries(ventasPorDia)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, total]) => ({
      fecha,
      total,
      label: format(new Date(fecha + 'T12:00:00'), 'd/M'),
    }))

  // Top productos
  const productoMap: Record<string, { cantidad: number; monto: number }> = {}
  ventas30?.forEach(v => {
    const items = (v.items as { producto_nombre: string; cantidad: number; subtotal: number }[]) ?? []
    items.forEach(i => {
      if (!productoMap[i.producto_nombre]) productoMap[i.producto_nombre] = { cantidad: 0, monto: 0 }
      productoMap[i.producto_nombre].cantidad += i.cantidad
      productoMap[i.producto_nombre].monto += i.subtotal
    })
  })
  const topProductos = Object.entries(productoMap)
    .map(([nombre, stats]) => ({ nombre, ...stats }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10)

  // Inventario semanal (últimas 8 semanas)
  const semanaMap: Record<string, number> = {}
  inventario8sem?.forEach(r => {
    const d = new Date(r.fecha + 'T12:00:00')
    const sw = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    semanaMap[sw] = (semanaMap[sw] ?? 0) + r.total_dia
  })
  const inventarioSemanal = Object.entries(semanaMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, total]) => ({
      semana: format(new Date(fecha + 'T12:00:00'), 'd/M', { locale: es }),
      total,
    }))

  const totalVentasMes = ventasMes?.reduce((s, v) => s + v.total, 0) ?? 0
  const totalInventarioMes = inventarioMes?.reduce((s, r) => s + r.total_dia, 0) ?? 0
  const diasConVenta = Object.keys(ventasPorDia).length
  const promedioVenta = diasConVenta > 0 ? totalVentasMes / diasConVenta : 0
  const productoEstrella = topProductos[0]?.nombre ?? ''

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {format(now, "MMMM yyyy", { locale: es }).charAt(0).toUpperCase() + format(now, "MMMM yyyy", { locale: es }).slice(1)}
        </p>
      </div>
      <AnalyticsClient
        data={{
          ventasDiarias,
          topProductos,
          inventarioSemanal,
          resumen: { totalVentasMes, totalInventarioMes, diasConVenta, promedioVenta, productoEstrella },
        }}
      />
    </div>
  )
}
