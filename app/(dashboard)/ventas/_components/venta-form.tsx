'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { DollarSign, Loader2, Save, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { guardarVentaSimple } from '../actions'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export function VentaForm() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [fecha, setFecha] = useState(today)
  const [total, setTotal] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    const monto = parseFloat(total)
    if (!monto || monto <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    const fd = new FormData()
    fd.set('fecha', fecha)
    fd.set('total', String(monto))
    startTransition(async () => {
      const result = await guardarVentaSimple(null, fd)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Venta guardada — ${formatCurrency(monto)}`)
        setTotal('')
        setFecha(today)
      }
    })
  }

  const esPasado = fecha < today

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          {/* Selector de fecha */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Día de la venta
            </label>
            <input
              type="date"
              value={fecha}
              max={today}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:border-red-400 transition-colors"
            />
            {esPasado && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <span>⚠</span> Registrando venta de un día anterior
              </p>
            )}
          </div>

          {/* Monto */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Venta neta del día
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">$</span>
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-4 text-3xl font-black text-gray-900 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-400 transition-colors placeholder:text-gray-200"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            {total && parseFloat(total) > 0 && (
              <p className="text-center text-sm text-gray-400">{formatCurrency(parseFloat(total))}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={isPending || !total || parseFloat(total) <= 0}
        className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold gap-2"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Save className="h-5 w-5" />
        )}
        {isPending ? 'Guardando...' : 'Guardar venta'}
      </Button>
    </div>
  )
}
