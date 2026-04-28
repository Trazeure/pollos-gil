import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { ReporteDocument, type ReporteData } from '@/app/(dashboard)/analytics/_components/reporte-document'
import React from 'react'
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, subDays,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement, JSXElementConstructor } from 'react'

export const dynamic = 'force-dynamic'

function mxnLabel(d: Date) {
  return format(d, "d 'de' MMMM yyyy", { locale: es })
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const periodo = searchParams.get('periodo') ?? 'mes'

    const now = new Date()
    let desde: string
    let hasta: string
    let periodoLabel: string
    let agrupar: 'dia' | 'semana' | 'mes'

    if (periodo === 'semana') {
      desde = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      hasta = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      periodoLabel = `Semana del ${mxnLabel(startOfWeek(now, { weekStartsOn: 1 }))} al ${mxnLabel(endOfWeek(now, { weekStartsOn: 1 }))}`
      agrupar = 'dia'
    } else if (periodo === 'anual') {
      desde = format(startOfYear(now), 'yyyy-MM-dd')
      hasta = format(endOfYear(now), 'yyyy-MM-dd')
      periodoLabel = `Año ${format(now, 'yyyy')}`
      agrupar = 'mes'
    } else {
      desde = format(startOfMonth(now), 'yyyy-MM-dd')
      hasta = format(endOfMonth(now), 'yyyy-MM-dd')
      periodoLabel = format(now, "MMMM 'de' yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())
      agrupar = 'semana'
    }

    const [{ data: ventas }, { data: recibimientos }] = await Promise.all([
      supabase.from('ventas').select('fecha, items, total').gte('fecha', desde).lte('fecha', hasta).order('fecha'),
      supabase.from('recibimientos').select('fecha, total_dia').gte('fecha', desde).lte('fecha', hasta).order('fecha'),
    ])

    // Aggregate
    const ventasMap: Record<string, number> = {}
    const gastosMap: Record<string, number> = {}

    function getKey(fecha: string): string {
      const d = new Date(fecha + 'T12:00:00')
      if (agrupar === 'dia') return fecha
      if (agrupar === 'semana') return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      return fecha.substring(0, 7)
    }

    function getLabel(key: string): string {
      if (agrupar === 'dia') {
        const d = new Date(key + 'T12:00:00')
        return format(d, "EEE d 'de' MMM", { locale: es })
      }
      if (agrupar === 'semana') {
        const d = new Date(key + 'T12:00:00')
        const end = endOfWeek(d, { weekStartsOn: 1 })
        return `${format(d, 'd MMM', { locale: es })} – ${format(end, 'd MMM', { locale: es })}`
      }
      const d = new Date(key + '-01T12:00:00')
      return format(d, "MMMM yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())
    }

    ventas?.forEach(v => {
      const k = getKey(v.fecha)
      ventasMap[k] = (ventasMap[k] ?? 0) + v.total
    })
    recibimientos?.forEach(r => {
      const k = getKey(r.fecha)
      gastosMap[k] = (gastosMap[k] ?? 0) + r.total_dia
    })

    const allKeys = [...new Set([...Object.keys(ventasMap), ...Object.keys(gastosMap)])].sort()
    const detalles = allKeys.map(k => {
      const v = ventasMap[k] ?? 0
      const g = gastosMap[k] ?? 0
      return { label: getLabel(k), ventas: v, gastos: g, utilidad: v - g }
    })

    const totalVentas = detalles.reduce((s, d) => s + d.ventas, 0)
    const totalGastos = detalles.reduce((s, d) => s + d.gastos, 0)
    const totalUtilidad = totalVentas - totalGastos
    const margen = totalVentas > 0 ? (totalUtilidad / totalVentas) * 100 : 0

    const diasConVenta = ventas?.length ?? 0

    // Top productos
    const prodMap: Record<string, { cantidad: number; monto: number }> = {}
    ventas?.forEach(v => {
      const items = (v.items as { producto_nombre: string; cantidad: number; subtotal: number }[]) ?? []
      items.forEach(i => {
        if (!prodMap[i.producto_nombre]) prodMap[i.producto_nombre] = { cantidad: 0, monto: 0 }
        prodMap[i.producto_nombre].cantidad += i.cantidad
        prodMap[i.producto_nombre].monto += i.subtotal
      })
    })
    const topProductos = Object.entries(prodMap)
      .map(([nombre, s]) => ({ nombre, ...s }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 10)

    const reporteData: ReporteData = {
      periodoLabel,
      generadoEn: format(now, "d 'de' MMMM yyyy, HH:mm", { locale: es }),
      resumen: { ventas: totalVentas, gastos: totalGastos, utilidad: totalUtilidad, margen, diasConVenta },
      detalles,
      topProductos,
    }

    const element = React.createElement(
      ReporteDocument,
      { data: reporteData }
    ) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>

    const buffer = await renderToBuffer(element)
    const filename = `reporte-pollos-gil-${periodo}-${format(now, 'yyyy-MM-dd')}.pdf`

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Error reporte PDF:', err)
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 })
  }
}
