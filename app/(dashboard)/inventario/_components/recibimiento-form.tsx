'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { guardarRecibimiento } from '../actions'
import { formatCurrency } from '@/lib/utils'

interface RecibimientoData {
  fecha: string
  menudencia_kilos: number
  menudencia_precio: number
  seara_kilos: number
  seara_precio: number
  pollo_kilos: number
  pollo_precio: number
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold gap-2"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
      {pending ? 'Guardando...' : 'Guardar día'}
    </Button>
  )
}

interface Props {
  fecha: string
  existing?: RecibimientoData
}

export function RecibimientoForm({ fecha, existing }: Props) {
  const [state, formAction] = useFormState(guardarRecibimiento, null)

  const [values, setValues] = useState({
    menudencia_kilos: existing?.menudencia_kilos ?? 0,
    menudencia_precio: existing?.menudencia_precio ?? 0,
    seara_kilos: existing?.seara_kilos ?? 0,
    seara_precio: existing?.seara_precio ?? 0,
    pollo_kilos: existing?.pollo_kilos ?? 0,
    pollo_precio: existing?.pollo_precio ?? 0,
  })

  useEffect(() => {
    if (state && 'ok' in state && state.ok) {
      toast.success('Recibimiento guardado correctamente')
    }
    if (state && 'error' in state && state.error) {
      toast.error(state.error)
    }
  }, [state])

  const set = (key: keyof typeof values, val: string) =>
    setValues((v) => ({ ...v, [key]: parseFloat(val) || 0 }))

  const rows = [
    {
      label: 'Menudencia',
      kilosKey: 'menudencia_kilos' as const,
      precioKey: 'menudencia_precio' as const,
      color: 'bg-orange-50 border-orange-200',
      dot: 'bg-orange-400',
    },
    {
      label: 'Seara (pechuga)',
      kilosKey: 'seara_kilos' as const,
      precioKey: 'seara_precio' as const,
      color: 'bg-blue-50 border-blue-200',
      dot: 'bg-blue-400',
    },
    {
      label: 'Pollo',
      kilosKey: 'pollo_kilos' as const,
      precioKey: 'pollo_precio' as const,
      color: 'bg-yellow-50 border-yellow-200',
      dot: 'bg-yellow-400',
    },
  ]

  const subtotals = rows.map((r) => values[r.kilosKey] * values[r.precioKey])
  const total = subtotals.reduce((a, b) => a + b, 0)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="fecha" value={fecha} />

      {/* Rows */}
      {rows.map((row, i) => (
        <Card key={row.label} className={`border ${row.color} shadow-none`}>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${row.dot}`} />
              {row.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Kilos</Label>
                <Input
                  name={row.kilosKey}
                  type="number"
                  min="0"
                  step="0.1"
                  value={values[row.kilosKey] || ''}
                  onChange={(e) => set(row.kilosKey, e.target.value)}
                  placeholder="0"
                  className="h-11 text-base text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Precio/kg</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input
                    name={row.precioKey}
                    type="number"
                    min="0"
                    step="0.01"
                    value={values[row.precioKey] || ''}
                    onChange={(e) => set(row.precioKey, e.target.value)}
                    placeholder="0.00"
                    className="h-11 text-base pl-6"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Subtotal</Label>
                <div className="h-11 flex items-center justify-end px-3 bg-white rounded-md border border-gray-200 font-semibold text-gray-800">
                  {formatCurrency(subtotals[i])}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Total */}
      <Card className="border-0 bg-gray-900 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-300">
              <Calculator className="h-5 w-5" />
              <span className="font-medium">Total del día</span>
            </div>
            <span className="text-2xl font-black text-white">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      <SaveButton />
    </form>
  )
}
