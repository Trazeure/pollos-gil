'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Pencil, Check, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'
import { actualizarPrecio, toggleActivo } from '../actions'
import { formatCurrency } from '@/lib/utils'
import type { Producto } from '@/lib/types'

interface ProductRowProps {
  producto: Producto
}

export function ProductRow({ producto }: ProductRowProps) {
  const [editingPrice, setEditingPrice] = useState(false)
  const [priceValue, setPriceValue] = useState(String(producto.precio))
  const [activo, setActivo] = useState(producto.activo)
  const [isPending, startTransition] = useTransition()

  function handleSavePrice() {
    const newPrice = parseFloat(priceValue)
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Precio inválido')
      return
    }
    startTransition(async () => {
      const result = await actualizarPrecio(producto.id, newPrice)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Precio actualizado: ${formatCurrency(newPrice)}`)
        setEditingPrice(false)
      }
    })
  }

  function handleCancelPrice() {
    setPriceValue(String(producto.precio))
    setEditingPrice(false)
  }

  function handleToggle(checked: boolean) {
    setActivo(checked)
    startTransition(async () => {
      const result = await toggleActivo(producto.id, checked)
      if (result.error) {
        toast.error(result.error)
        setActivo(!checked)
      } else {
        toast.success(checked ? 'Producto activado' : 'Producto desactivado')
      }
    })
  }

  return (
    <TableRow className={!activo ? 'opacity-50' : ''}>
      <TableCell className="font-medium text-gray-900">{producto.nombre}</TableCell>
      <TableCell>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {producto.unidad}
        </span>
      </TableCell>
      <TableCell>
        {editingPrice ? (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-sm">$</span>
            <Input
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              className="h-8 w-24 text-sm"
              type="number"
              min="0"
              step="0.01"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePrice()
                if (e.key === 'Escape') handleCancelPrice()
              }}
            />
            <button
              onClick={handleSavePrice}
              disabled={isPending}
              className="h-7 w-7 flex items-center justify-center rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleCancelPrice}
              className="h-7 w-7 flex items-center justify-center rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingPrice(true)}
            className="group flex items-center gap-1.5 font-semibold text-gray-900 hover:text-red-600 transition-colors"
          >
            {formatCurrency(producto.precio)}
            <Pencil
              size={12}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400"
            />
          </button>
        )}
      </TableCell>
      <TableCell>
        <Switch
          checked={activo}
          onCheckedChange={handleToggle}
          disabled={isPending}
        />
      </TableCell>
    </TableRow>
  )
}
