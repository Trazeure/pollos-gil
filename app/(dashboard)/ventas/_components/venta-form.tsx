'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, ShoppingCart, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { guardarVenta } from '../actions'
import { formatCurrency } from '@/lib/utils'
import type { Producto } from '@/lib/types'
import { format } from 'date-fns'

interface Props {
  productos: Producto[]
}

interface ItemVenta {
  producto_id: string
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export function VentaForm({ productos }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [isPending, startTransition] = useTransition()

  const set = (id: string, val: number) =>
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, val) }))

  const items: ItemVenta[] = productos
    .filter((p) => p.activo && (quantities[p.id] ?? 0) > 0)
    .map((p) => ({
      producto_id: p.id,
      producto_nombre: p.nombre,
      cantidad: quantities[p.id] ?? 0,
      precio_unitario: p.precio,
      subtotal: (quantities[p.id] ?? 0) * p.precio,
    }))

  const total = items.reduce((s, i) => s + i.subtotal, 0)

  function handleSubmit() {
    if (items.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }
    const fd = new FormData()
    fd.set('fecha', today)
    fd.set('items', JSON.stringify(items))
    startTransition(async () => {
      const result = await guardarVenta(null, fd)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Venta guardada — Total: ${formatCurrency(total)}`)
        setQuantities({})
      }
    })
  }

  const byCategory: Record<string, Producto[]> = {}
  productos
    .filter((p) => p.activo)
    .forEach((p) => {
      if (!byCategory[p.categoria]) byCategory[p.categoria] = []
      byCategory[p.categoria].push(p)
    })

  return (
    <div className="space-y-5">
      {Object.entries(byCategory).map(([cat, prods]) => (
        <div key={cat}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            {cat}
          </h3>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="divide-y">
              {prods.map((p) => {
                const qty = quantities[p.id] ?? 0
                const subtotal = qty * p.precio
                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(p.precio)}/{p.unidad}
                        {subtotal > 0 && (
                          <span className="ml-2 text-green-600 font-medium">
                            = {formatCurrency(subtotal)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => set(p.id, qty - 1)}
                        disabled={qty === 0}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={qty || ''}
                        onChange={(e) => set(p.id, parseInt(e.target.value) || 0)}
                        className="w-12 text-center text-sm font-semibold border border-gray-200 rounded-lg h-8 focus:outline-none focus:ring-2 focus:ring-red-500"
                        min="0"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => set(p.id, qty + 1)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      ))}

      {/* Resumen */}
      {items.length > 0 && (
        <Card className="border-0 bg-gray-900 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Resumen</p>
            {items.map((i) => (
              <div key={i.producto_id} className="flex justify-between text-sm text-gray-300">
                <span>{i.producto_nombre} ×{i.cantidad}</span>
                <span>{formatCurrency(i.subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-gray-700 pt-2 flex justify-between">
              <span className="text-white font-semibold">Total</span>
              <span className="text-2xl font-black text-white">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending || items.length === 0}
        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold gap-2"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ShoppingCart className="h-5 w-5" />
        )}
        {isPending ? 'Guardando...' : 'Guardar ventas del día'}
      </Button>
    </div>
  )
}
