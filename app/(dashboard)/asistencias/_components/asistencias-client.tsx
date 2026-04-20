'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Minus, Trash2, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { marcarAsistencia, borrarAsistencia } from '../actions'
import type { Trabajador, Asistencia, EstadoAsistencia } from '@/lib/types'
import { format, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  trabajadores: Trabajador[]
  asistenciasHoy: Asistencia[]
}

type AsistenciaMap = Record<string, EstadoAsistencia>

const ESTADOS = [
  { key: 'presente' as EstadoAsistencia, label: 'Presente', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { key: 'retardo' as EstadoAsistencia, label: 'Retardo', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
  { key: 'ausente' as EstadoAsistencia, label: 'Ausente', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200 hover:bg-red-100' },
]

function fmtFecha(date: Date) { return format(date, 'yyyy-MM-dd') }
function fmtLabel(date: Date) {
  const today = fmtFecha(new Date())
  const d = fmtFecha(date)
  if (d === today) return 'Hoy'
  if (d === fmtFecha(addDays(new Date(), -1))) return 'Ayer'
  return format(date, "EEEE d 'de' MMMM", { locale: es })
}

export function AsistenciasClient({ trabajadores, asistenciasHoy }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isPending, startTransition] = useTransition()

  const initMap: AsistenciaMap = {}
  asistenciasHoy.forEach((a) => { initMap[a.trabajador_id] = a.estado })
  const [asistencias, setAsistencias] = useState<AsistenciaMap>(initMap)

  function goDay(delta: number) {
    setSelectedDate((d) => delta > 0 ? addDays(d, 1) : subDays(d, 1))
  }

  function handleMarcar(trabajadorId: string, estado: EstadoAsistencia) {
    const prev = asistencias[trabajadorId]
    setAsistencias((m) => ({ ...m, [trabajadorId]: estado }))
    startTransition(async () => {
      const result = await marcarAsistencia(trabajadorId, fmtFecha(selectedDate), estado)
      if (result.error) {
        toast.error(result.error)
        if (prev) setAsistencias((m) => ({ ...m, [trabajadorId]: prev }))
        else setAsistencias((m) => { const next = { ...m }; delete next[trabajadorId]; return next })
      }
    })
  }

  function handleBorrar(trabajadorId: string) {
    const prev = asistencias[trabajadorId]
    setAsistencias((m) => { const next = { ...m }; delete next[trabajadorId]; return next })
    startTransition(async () => {
      const result = await borrarAsistencia(trabajadorId, fmtFecha(selectedDate))
      if (result.error) {
        toast.error(result.error)
        if (prev) setAsistencias((m) => ({ ...m, [trabajadorId]: prev }))
      } else {
        toast.success('Asistencia eliminada')
      }
    })
  }

  const presentes = Object.values(asistencias).filter((e) => e === 'presente').length
  const retardos = Object.values(asistencias).filter((e) => e === 'retardo').length
  const ausentes = Object.values(asistencias).filter((e) => e === 'ausente').length
  const sinRegistro = trabajadores.length - presentes - retardos - ausentes

  const fechaISO = fmtFecha(selectedDate)
  const mesActual = selectedDate.getMonth() + 1
  const anioActual = selectedDate.getFullYear()

  return (
    <div className="space-y-5">
      {/* Date navigator */}
      <div className="flex items-center justify-between bg-white rounded-xl border shadow-sm px-4 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goDay(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-semibold text-gray-900 capitalize">{fmtLabel(selectedDate)}</p>
          <p className="text-xs text-gray-400">{format(selectedDate, "d 'de' MMMM yyyy", { locale: es })}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => goDay(1)}
          disabled={fechaISO >= fmtFecha(new Date())}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Botones PDF */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          asChild
        >
          <a href={`/api/asistencias/pdf?tipo=semanal&fecha=${fechaISO}`} target="_blank" rel="noopener noreferrer">
            <FileDown className="h-3.5 w-3.5" />
            PDF Semanal
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          asChild
        >
          <a href={`/api/asistencias/pdf?tipo=mensual&mes=${mesActual}&anio=${anioActual}`} target="_blank" rel="noopener noreferrer">
            <FileDown className="h-3.5 w-3.5" />
            PDF Mensual
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          asChild
        >
          <a href={`/api/asistencias/pdf?tipo=anual&anio=${anioActual}`} target="_blank" rel="noopener noreferrer">
            <FileDown className="h-3.5 w-3.5" />
            PDF Anual
          </a>
        </Button>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Presentes', value: presentes, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Retardos', value: retardos, color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Ausentes', value: ausentes, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Sin marcar', value: sinRegistro, color: 'text-gray-500', bg: 'bg-gray-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-xl p-3 text-center', bg)}>
            <p className={cn('text-xl font-black', color)}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Workers list */}
      {trabajadores.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">No hay trabajadores activos</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="divide-y">
            {trabajadores.map((t) => {
              const estadoActual = asistencias[t.id]
              const initials = t.nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()

              return (
                <div key={t.id} className="px-4 py-3.5 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{t.nombre}</p>
                    <p className="text-xs text-gray-400">{t.puesto}</p>
                  </div>

                  {/* Estado actual (desktop) */}
                  {estadoActual ? (
                    <span className={cn(
                      'hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium mr-1',
                      ESTADOS.find(e => e.key === estadoActual)?.bg,
                      ESTADOS.find(e => e.key === estadoActual)?.color,
                    )}>
                      {estadoActual}
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-400 mr-1">
                      <Minus className="h-3 w-3" />Sin marcar
                    </span>
                  )}

                  {/* Botones marcar */}
                  <div className="flex gap-1 shrink-0">
                    {ESTADOS.map(({ key, label, icon: Icon, color, bg }) => (
                      <button
                        key={key}
                        onClick={() => handleMarcar(t.id, key)}
                        disabled={isPending}
                        title={label}
                        className={cn(
                          'h-8 w-8 rounded-lg border flex items-center justify-center transition-all',
                          estadoActual === key
                            ? cn(bg, color, 'shadow-sm scale-110 border-2')
                            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}

                    {/* Borrar registro */}
                    {estadoActual && (
                      <button
                        onClick={() => handleBorrar(t.id)}
                        disabled={isPending}
                        title="Quitar registro"
                        className="h-8 w-8 rounded-lg border bg-white border-gray-200 text-gray-300 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-all ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <p className="text-xs text-gray-300 text-center">
        ✓ Presente · ⏰ Retardo · ✕ Ausente · 🗑 Quitar registro
      </p>
    </div>
  )
}
