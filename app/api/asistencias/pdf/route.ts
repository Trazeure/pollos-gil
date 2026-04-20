import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { AsistenciasReportDocument } from '@/app/(dashboard)/asistencias/_components/asistencias-report-document'
import type { AsistenciaReportData, WorkerStat } from '@/app/(dashboard)/asistencias/_components/asistencias-report-document'
import React from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement, JSXElementConstructor } from 'react'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, getDaysInMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo') as 'semanal' | 'mensual' | 'anual' | null
  if (!tipo) return NextResponse.json({ error: 'tipo requerido' }, { status: 400 })

  const supabase = await createClient()

  // Fetch all active workers
  const { data: trabajadoresRaw } = await supabase
    .from('trabajadores')
    .select('id, nombre, puesto')
    .eq('activo', true)
    .order('nombre')

  const trabajadores: WorkerStat[] = trabajadoresRaw ?? []

  let reportData: AsistenciaReportData

  if (tipo === 'semanal') {
    const fechaParam = searchParams.get('fecha') ?? format(new Date(), 'yyyy-MM-dd')
    const base = new Date(fechaParam + 'T12:00:00')
    const weekStart = startOfWeek(base, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(base, { weekStartsOn: 1 })
    const dias = eachDayOfInterval({ start: weekStart, end: weekEnd }).map((d) => format(d, 'yyyy-MM-dd'))

    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('trabajador_id, fecha, estado')
      .gte('fecha', dias[0])
      .lte('fecha', dias[6])

    const records: Record<string, Record<string, string>> = {}
    for (const a of (asistencias ?? [])) {
      if (!records[a.trabajador_id]) records[a.trabajador_id] = {}
      records[a.trabajador_id][a.fecha] = a.estado
    }

    reportData = {
      tipo: 'semanal',
      fechaInicio: dias[0],
      fechaFin: dias[6],
      trabajadores,
      dias,
      records,
    }

  } else if (tipo === 'mensual') {
    const mes = Number(searchParams.get('mes') ?? new Date().getMonth() + 1)
    const anio = Number(searchParams.get('anio') ?? new Date().getFullYear())
    const desde = `${anio}-${String(mes).padStart(2, '0')}-01`
    const hasta = `${anio}-${String(mes).padStart(2, '0')}-${String(getDaysInMonth(new Date(anio, mes - 1))).padStart(2, '0')}`
    const totalDias = getDaysInMonth(new Date(anio, mes - 1))

    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('trabajador_id, estado')
      .gte('fecha', desde)
      .lte('fecha', hasta)

    const statsMap: Record<string, { presentes: number; retardos: number; ausentes: number }> = {}
    for (const a of (asistencias ?? [])) {
      if (!statsMap[a.trabajador_id]) statsMap[a.trabajador_id] = { presentes: 0, retardos: 0, ausentes: 0 }
      if (a.estado === 'presente') statsMap[a.trabajador_id].presentes++
      else if (a.estado === 'retardo') statsMap[a.trabajador_id].retardos++
      else if (a.estado === 'ausente') statsMap[a.trabajador_id].ausentes++
    }

    reportData = {
      tipo: 'mensual',
      mes,
      anio,
      trabajadores: trabajadores.map((t) => {
        const s = statsMap[t.id] ?? { presentes: 0, retardos: 0, ausentes: 0 }
        const marcados = s.presentes + s.retardos + s.ausentes
        return { ...t, ...s, sinRegistro: totalDias - marcados, totalDias }
      }),
    }

  } else {
    const anio = Number(searchParams.get('anio') ?? new Date().getFullYear())

    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('trabajador_id, fecha, estado')
      .gte('fecha', `${anio}-01-01`)
      .lte('fecha', `${anio}-12-31`)

    const statsMap: Record<string, Record<number, number>> = {}
    for (const a of (asistencias ?? [])) {
      if (a.estado === 'ausente') continue
      const mes = Number(a.fecha.split('-')[1])
      if (!statsMap[a.trabajador_id]) statsMap[a.trabajador_id] = {}
      statsMap[a.trabajador_id][mes] = (statsMap[a.trabajador_id][mes] ?? 0) + 1
    }

    reportData = {
      tipo: 'anual',
      anio,
      trabajadores: trabajadores.map((t) => {
        const meses = statsMap[t.id] ?? {}
        const total = Object.values(meses).reduce((s, v) => s + v, 0)
        return { ...t, meses, total }
      }),
    }
  }

  const element = React.createElement(
    AsistenciasReportDocument,
    { data: reportData }
  ) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>

  const buffer = await renderToBuffer(element)
  const filename = tipo === 'semanal' ? 'reporte-semanal' : tipo === 'mensual' ? 'reporte-mensual' : 'reporte-anual'

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}-asistencias-pollos-gil.pdf"`,
    },
  })
}
