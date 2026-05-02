'use client'

import { useRouter } from 'next/navigation'
import { CalendarDays } from 'lucide-react'

export function FechaSelector({ fecha, max }: { fecha: string; max: string }) {
  const router = useRouter()
  const esHoy = fecha === max

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5" />
        Día a registrar
      </label>
      <input
        type="date"
        value={fecha}
        max={max}
        onChange={(e) => {
          if (e.target.value) router.replace(`?fecha=${e.target.value}`)
        }}
        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:border-red-400 transition-colors"
      />
      {!esHoy && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <span>⚠</span> Registrando recibimiento de un día anterior
        </p>
      )}
    </div>
  )
}
