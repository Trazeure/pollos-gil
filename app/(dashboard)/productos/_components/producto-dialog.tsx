'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CATEGORIAS_PRODUCTO } from '@/lib/constants'
import { crearProducto, editarProducto } from '../actions'
import type { Producto } from '@/lib/types'
import { useState } from 'react'

const UNIDADES = ['pieza', 'kg', 'porción', 'paquete']

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="bg-red-600 hover:bg-red-700 text-white">
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      {label}
    </Button>
  )
}

function ProductoForm({
  action,
  producto,
  onSuccess,
}: {
  action: (prev: unknown, fd: FormData) => Promise<{ ok?: boolean; error?: string }>
  producto?: Producto
  onSuccess: () => void
}) {
  const [state, formAction] = useFormState(action, null)
  const [categoria, setCategoria] = useState(producto?.categoria ?? '')
  const [unidad, setUnidad] = useState(producto?.unidad ?? 'pieza')

  useEffect(() => {
    if (state && 'ok' in state && state.ok) {
      toast.success(producto ? 'Producto actualizado' : 'Producto agregado')
      onSuccess()
    }
    if (state && 'error' in state && state.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-4">
      {producto && <input type="hidden" name="id" value={producto.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre del producto</Label>
        <Input
          id="nombre"
          name="nombre"
          placeholder="Ej: Pollo Entero"
          defaultValue={producto?.nombre}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <input type="hidden" name="categoria" value={categoria} />
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS_PRODUCTO.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Unidad</Label>
          <input type="hidden" name="unidad" value={unidad} />
          <Select value={unidad} onValueChange={setUnidad}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIDADES.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="precio">Precio (MXN)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
          <Input
            id="precio"
            name="precio"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            defaultValue={producto?.precio}
            className="pl-7"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button variant="outline" type="button">
            Cancelar
          </Button>
        </DialogClose>
        <SubmitBtn label={producto ? 'Guardar cambios' : 'Agregar producto'} />
      </div>
    </form>
  )
}

export function AgregarProductoDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
          <Plus size={16} />
          Agregar producto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
        </DialogHeader>
        <ProductoForm action={crearProducto} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function EditarProductoDialog({ producto }: { producto: Producto }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Pencil size={14} />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
        </DialogHeader>
        <ProductoForm action={editarProducto} producto={producto} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
