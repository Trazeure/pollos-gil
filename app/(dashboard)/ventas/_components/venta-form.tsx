'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { DollarSign, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { guardarVentaSimple } from '../actions'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export function VentaForm() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [total, setTotal] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    const monto = parseFloat(total)
    if (!monto || monto <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    const fd = new FormData()
    fd.set('fecha', today)
    fd.set('total', String(monto))
    startTransition(async () => {
      const result = await guardarVentaSimple(null, fd)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Venta guardada — ${formatCurrency(monto)}`)
        setTotal('')
      }
    })
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Venta neta del día</p>
              <p className="text-xs text-gray-400">Ingresa el total vendido</p>
            </div>
          </div>

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
            <p className="text-center text-sm text-gray-500">
              {formatCurrency(parseFloat(total))}
            </p>
          )}
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
        {isPending ? 'Guardando...' : 'Guardar venta del día'}
      </Button>
    </div>
  )
}
