import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { ReporteAbuelosDocument, type ReporteAbuelosData } from '@/app/(dashboard)/reporte-abuelos/_components/reporte-abuelos-document'
import React from 'react'
import {
  format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear,
  startOfWeek, endOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement, JSXElementConstructor } from 'react'

export const dynamic = 'force-dynamic'

function mxnLabel(d: Date) {
  return format(d, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
    .replace(/^\w/, c => c.toUpperCase())
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const tipo = (searchParams.get('tipo') ?? 'diario') as 'diario' | 'semanal' | 'mensual' | 'anual'

    const now = new Date()
    let reporteData: ReporteAbuelosData

    if (tipo === 'diario') {
      const today = format(now, 'yyyy-MM-dd')
      const yesterday = format(subDays(now, 1), 'yyyy-MM-dd')

      const [
        { data: ventasHoy },
        { data: gastosHoy },
        { data: ventasAyer },
        { data: gastosAyer },
      ] = await Promise.all([
        supabase.from('ventas').select('total').eq('fecha', today),
        supabase.from('recibimientos').select('total_dia').eq('fecha', today),
        supabase.from('ventas').select('total').eq('fecha', yesterday),
        supabase.from('recibimientos').select('total_dia').eq('fecha', yesterday),
      ])

      const totalVentas = ventasHoy?.reduce((s, v) => s + v.total, 0) ?? 0
      const totalGastos = gastosHoy?.reduce((s, r) => s + r.total_dia, 0) ?? 0
      const ayerVentas = ventasAyer?.reduce((s, v) => s + v.total, 0) ?? 0
      const ayerGastos = gastosAyer?.reduce((s, r) => s + r.total_dia, 0) ?? 0

      reporteData = {
        tipo: 'diario',
        periodoLabel: mxnLabel(now),
        generadoEn: format(now, "d 'de' MMMM yyyy, HH:mm", { locale: es }),
        totalVentas,
        totalGastos,
        totalGanancia: totalVentas - totalGastos,
        ayerVentas,
        ayerGastos,
        ayerGanancia: ayerVentas - ayerGastos,
        periodos: [],
      }
    } else if (tipo === 'semanal') {
      const desde = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const hasta = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const semLabel = `Semana del ${format(startOfWeek(now, { weekStartsOn: 1 }), "d 'de' MMMM", { locale: es })} al ${format(endOfWeek(now, { weekStartsOn: 1 }), "d 'de' MMMM 'de' yyyy", { locale: es })}`

      const [{ data: ventas }, { data: gastos }] = await Promise.all([
        supabase.from('ventas').select('fecha, total').gte('fecha', desde).lte('fecha', hasta).order('fecha'),
        supabase.from('recibimientos').select('fecha, total_dia').gte('fecha', desde).lte('fecha', hasta).order('fecha'),
      ])

      const ventasMap: Record<string, number> = {}
      const gastosMap: Record<string, number> = {}
      ventas?.forEach(v => { ventasMap[v.fecha] = (ventasMap[v.fecha] ?? 0) + v.total })
      gastos?.forEach(r => { gastosMap[r.fecha] = (gastosMap[r.fecha] ?? 0) + r.total_dia })

      const allKeys = [...new Set([...Object.keys(ventasMap), ...Object.keys(gastosMap)])].sort()
      const periodos = allKeys.map(k => ({
        label: format(new Date(k + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es }).replace(/^\w/, c => c.toUpperCase()),
        ventas: ventasMap[k] ?? 0,
        gastos: gastosMap[k] ?? 0,
      }))

      const totalVentas = periodos.reduce((s, p) => s + p.ventas, 0)
      const totalGastos = periodos.reduce((s, p) => s + p.gastos, 0)

      reporteData = {
        tipo: 'mensual',
        periodoLabel: semLabel,
        generadoEn: format(now, "d 'de' MMMM yyyy, HH:mm", { locale: es }),
        totalVentas,
        totalGastos,
        totalGanancia: totalVentas - totalGastos,
        periodos,
      }
    } else if (tipo === 'mensual') {
      const desde = format(startOfMonth(now), 'yyyy-MM-dd')
      const hasta = format(endOfMonth(now), 'yyyy-MM-dd')
      const mesLabel = format(now, "MMMM 'de' yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())

      const [{ data: ventas }, { data: gastos }] = await Promise.all([
        supabase.from('ventas').select('fecha, total').gte('fecha', desde).lte('fecha', hasta).order('fecha'),
        supabase.from('recibimientos').select('fecha, total_dia').gte('fecha', desde).lte('fecha', hasta).order('fecha'),
      ])

      const ventasMap: Record<string, number> = {}
      const gastosMap: Record<string, number> = {}

      ventas?.forEach(v => {
        const d = new Date(v.fecha + 'T12:00:00')
        const k = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        ventasMap[k] = (ventasMap[k] ?? 0) + v.total
      })
      gastos?.forEach(r => {
        const d = new Date(r.fecha + 'T12:00:00')
        const k = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        gastosMap[k] = (gastosMap[k] ?? 0) + r.total_dia
      })

      const allKeys = [...new Set([...Object.keys(ventasMap), ...Object.keys(gastosMap)])].sort()
      const periodos = allKeys.map((k, i) => {
        const d = new Date(k + 'T12:00:00')
        const end = endOfWeek(d, { weekStartsOn: 1 })
        return {
          label: `Semana ${i + 1}  (${format(d, 'd MMM', { locale: es })} – ${format(end, 'd MMM', { locale: es })})`,
          ventas: ventasMap[k] ?? 0,
          gastos: gastosMap[k] ?? 0,
        }
      })

      const totalVentas = periodos.reduce((s, p) => s + p.ventas, 0)
      const totalGastos = periodos.reduce((s, p) => s + p.gastos, 0)

      reporteData = {
        tipo: 'mensual',
        periodoLabel: mesLabel,
        generadoEn: format(now, "d 'de' MMMM yyyy, HH:mm", { locale: es }),
        totalVentas,
        totalGastos,
        totalGanancia: totalVentas - totalGastos,
        periodos,
      }
    } else {
      const desde = format(startOfYear(now), 'yyyy-MM-dd')
      const hasta = format(endOfYear(now), 'yyyy-MM-dd')
      const anioLabel = `Año ${format(now, 'yyyy')}`

      const [{ data: ventas }, { data: gastos }] = await Promise.all([
        supabase.from('ventas').select('fecha, total').gte('fecha', desde).lte('fecha', hasta).order('fecha'),
        supabase.from('recibimientos').select('fecha, total_dia').gte('fecha', desde).lte('fecha', hasta).order('fecha'),
      ])

      const ventasMap: Record<string, number> = {}
      const gastosMap: Record<string, number> = {}

      ventas?.forEach(v => {
        const m = v.fecha.substring(0, 7)
        ventasMap[m] = (ventasMap[m] ?? 0) + v.total
      })
      gastos?.forEach(r => {
        const m = r.fecha.substring(0, 7)
        gastosMap[m] = (gastosMap[m] ?? 0) + r.total_dia
      })

      const allKeys = [...new Set([...Object.keys(ventasMap), ...Object.keys(gastosMap)])].sort()
      const periodos = allKeys.map(k => {
        const d = new Date(k + '-01T12:00:00')
        return {
          label: format(d, "MMMM yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase()),
          ventas: ventasMap[k] ?? 0,
          gastos: gastosMap[k] ?? 0,
        }
      })

      const totalVentas = periodos.reduce((s, p) => s + p.ventas, 0)
      const totalGastos = periodos.reduce((s, p) => s + p.gastos, 0)

      reporteData = {
        tipo: 'anual',
        periodoLabel: anioLabel,
        generadoEn: format(now, "d 'de' MMMM yyyy, HH:mm", { locale: es }),
        totalVentas,
        totalGastos,
        totalGanancia: totalVentas - totalGastos,
        periodos,
      }
    }

    const element = React.createElement(
      ReporteAbuelosDocument,
      { data: reporteData }
    ) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>

    const buffer = await renderToBuffer(element)
    const tipoNombre = tipo === 'semanal' ? 'semanal' : tipo
    const filename = `reporte-familia-pollos-gil-${tipoNombre}-${format(now, 'yyyy-MM-dd')}.pdf`

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Error reporte abuelos PDF:', err)
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 })
  }
}
