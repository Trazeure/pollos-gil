'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ClipboardList, Loader2, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { crearPedido } from '../actions'
import type { EstadoPedido } from '@/lib/types'

interface ItemForm { nombre: string; cantidad: number; precio: number }

const ESTADOS: { value: EstadoPedido; label: string; color: string }[] = [
  { value: 'pendiente', label: 'Pendiente', color: 'text-yellow-700' },
  { value: 'pagado', label: 'Pagado', color: 'text-green-700' },
  { value: 'a_deber', label: 'A Deber', color: 'text-red-700' },
]

export function NuevoPedidoDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [cliente, setCliente] = useState('')
  const [telefono, setTelefono] = useState('')
  const [estado, setEstado] = useState<EstadoPedido>('pendiente')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [notas, setNotas] = useState('')
  const [items, setItems] = useState<ItemForm[]>([{ nombre: '', cantidad: 1, precio: 0 }])

  const total = items.reduce((s, i) => s + i.cantidad * i.precio, 0)

  function addItem() { setItems((p) => [...p, { nombre: '', cantidad: 1, precio: 0 }]) }
  function removeItem(idx: number) { setItems((p) => p.filter((_, i) => i !== idx)) }
  function updateItem(idx: number, field: keyof ItemForm, value: string | number) {
    setItems((p) => p.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  function reset() {
    setCliente(''); setTelefono(''); setEstado('pendiente')
    setFechaEntrega(''); setNotas('')
    setItems([{ nombre: '', cantidad: 1, precio: 0 }])
  }

  function handleSubmit() {
    if (!cliente.trim()) { toast.error('Ingresa el nombre del cliente'); return }
    if (items.some(i => !i.nombre.trim())) { toast.error('Todos los productos necesitan nombre'); return }
    startTransition(async () => {
      const result = await crearPedido({
        cliente: cliente.trim(),
        telefono: telefono.trim() || undefined,
        items: items.map(i => ({ producto_nombre: i.nombre, cantidad: i.cantidad, precio_unitario: i.precio, subtotal: i.cantidad * i.precio })),
        total,
        estado,
        fecha_entrega: fechaEntrega || undefined,
        notas: notas.trim() || undefined,
      })
      if (result.error) toast.error(result.error)
      else { toast.success('Pedido creado'); setOpen(false); reset() }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
          <Plus className="h-4 w-4" />Nuevo pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-red-600" />Nuevo pedido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Cliente */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Input placeholder="Nombre" value={cliente} onChange={e => setCliente(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><Phone className="h-3 w-3" />Teléfono</Label>
              <Input placeholder="866 000 0000" value={telefono} onChange={e => setTelefono(e.target.value)} />
            </div>
          </div>

          {/* Estado + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={v => setEstado(v as EstadoPedido)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha entrega</Label>
              <Input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Productos</Label>
              <Button variant="outline" size="sm" onClick={addItem} className="gap-1 h-7 text-xs">
                <Plus className="h-3 w-3" />Agregar
              </Button>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1.5fr_32px] gap-2 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                <span>Producto</span><span>Cant.</span><span>Precio</span><span />
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[2fr_1fr_1.5fr_32px] gap-2 px-3 py-2 border-t items-center">
                  <Input placeholder="Pollo entero..." value={item.nombre} onChange={e => updateItem(idx, 'nombre', e.target.value)} className="h-8 text-sm" />
                  <Input type="number" min={1} value={item.cantidad} onChange={e => updateItem(idx, 'cantidad', Number(e.target.value))} className="h-8 text-sm" />
                  <Input type="number" min={0} step={0.01} value={item.precio || ''} placeholder="0.00" onChange={e => updateItem(idx, 'precio', Number(e.target.value))} className="h-8 text-sm" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea placeholder="Instrucciones especiales..." value={notas} onChange={e => setNotas(e.target.value)} className="h-20 resize-none" />
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-xl font-black text-gray-900">{formatCurrency(total)}</span>
          </div>

          <Button onClick={handleSubmit} disabled={isPending} className="w-full bg-red-600 hover:bg-red-700 text-white gap-2">
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : <><ClipboardList className="h-4 w-4" />Crear pedido</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
