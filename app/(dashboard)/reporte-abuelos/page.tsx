import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { ReporteAbuelosClient } from './_components/reporte-abuelos-client'
import { Heart } from 'lucide-react'

export default async function ReporteAbuelosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const yesterday = format(subDays(now, 1), 'yyyy-MM-dd')
  const mesInicio = format(startOfMonth(now), 'yyyy-MM-dd')
  const mesFin = format(endOfMonth(now), 'yyyy-MM-dd')
  const anioInicio = format(startOfYear(now), 'yyyy-MM-dd')
  const anioFin = format(endOfYear(now), 'yyyy-MM-dd')
  const hace6m = format(subMonths(now, 5), 'yyyy-MM-dd').substring(0, 7) + '-01'

  const [
    { data: ventasHoy },
    { data: gastosHoy },
    { data: ventasAyer },
    { data: gastosAyer },
    { data: ventasMes },
    { data: gastosMes },
    { data: ventasAnio },
    { data: gastosAnio },
    { data: ventas6m },
    { data: gastos6m },
  ] = await Promise.all([
    supabase.from('ventas').select('total').eq('fecha', today),
    supabase.from('recibimientos').select('total_dia').eq('fecha', today),
    supabase.from('ventas').select('total').eq('fecha', yesterday),
    supabase.from('recibimientos').select('total_dia').eq('fecha', yesterday),
    supabase.from('ventas').select('total').gte('fecha', mesInicio).lte('fecha', mesFin),
    supabase.from('recibimientos').select('total_dia').gte('fecha', mesInicio).lte('fecha', mesFin),
    supabase.from('ventas').select('total').gte('fecha', anioInicio).lte('fecha', anioFin),
    supabase.from('recibimientos').select('total_dia').gte('fecha', anioInicio).lte('fecha', anioFin),
    supabase.from('ventas').select('fecha, total').gte('fecha', hace6m).order('fecha'),
    supabase.from('recibimientos').select('fecha, total_dia').gte('fecha', hace6m).order('fecha'),
  ])

  const sum = (arr: { total?: number; total_dia?: number }[] | null) =>
    arr?.reduce((s, x) => s + ((x as { total?: number }).total ?? (x as { total_dia?: number }).total_dia ?? 0), 0) ?? 0

  const hoyVentas = sum(ventasHoy)
  const hoyGastos = sum(gastosHoy)
  const ayerVentas = sum(ventasAyer)
  const ayerGastos = sum(gastosAyer)

  const mesVentasMap: Record<string, number> = {}
  const mesGastosMap: Record<string, number> = {}
  ventas6m?.forEach(v => {
    const m = v.fecha.substring(0, 7)
    mesVentasMap[m] = (mesVentasMap[m] ?? 0) + v.total
  })
  gastos6m?.forEach(r => {
    const m = r.fecha.substring(0, 7)
    mesGastosMap[m] = (mesGastosMap[m] ?? 0) + r.total_dia
  })
  const allMonths = [...new Set([...Object.keys(mesVentasMap), ...Object.keys(mesGastosMap)])].sort()
  const tendencia = allMonths.map(m => ({
    mes: format(new Date(m + '-01T12:00:00'), 'MMM yy', { locale: es }),
    ventas: mesVentasMap[m] ?? 0,
    gastos: mesGastosMap[m] ?? 0,
  }))

  const mesVentas = sum(ventasMes)
  const mesGastos = sum(gastosMes)
  const anioVentas = sum(ventasAnio)
  const anioGastos = sum(gastosAnio)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 bg-red-100 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
          <Heart className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporte para la Familia</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Números fáciles de entender · {format(now, "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      <ReporteAbuelosClient
        resumen={{
          hoyVentas,
          hoyGastos,
          hoyGanancia: hoyVentas - hoyGastos,
          ayerGanancia: ayerVentas - ayerGastos,
          mesVentas,
          mesGastos,
          mesGanancia: mesVentas - mesGastos,
          anioVentas,
          anioGastos,
          anioGanancia: anioVentas - anioGastos,
        }}
        tendencia={tendencia}
      />
    </div>
  )
}
