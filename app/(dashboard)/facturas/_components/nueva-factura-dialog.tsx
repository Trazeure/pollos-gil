'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, FileText, Loader2, MessageCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { formatCurrency } from '@/lib/utils'
import { crearFactura } from '../actions'
import type { Factura } from '@/lib/types'

interface ItemForm {
  producto_nombre: string
  cantidad: number
  precio_unitario: number
}

function calcSubtotal(i: ItemForm) {
  return i.cantidad * i.precio_unitario
}

export function NuevaFacturaDialog() {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState<Factura | null>(null)
  const [isPending, startTransition] = useTransition()

  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteRfc, setClienteRfc] = useState('')
  const [tieneIva, setTieneIva] = useState(false)
  const [items, setItems] = useState<ItemForm[]>([
    { producto_nombre: '', cantidad: 1, precio_unitario: 0 },
  ])

  const subtotal = items.reduce((s, i) => s + calcSubtotal(i), 0)
  const iva = tieneIva ? subtotal * 0.16 : 0
  const total = subtotal + iva

  function addItem() {
    setItems((prev) => [...prev, { producto_nombre: '', cantidad: 1, precio_unitario: 0 }])
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof ItemForm, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    )
  }

  function resetForm() {
    setClienteNombre('')
    setClienteRfc('')
    setTieneIva(false)
    setItems([{ producto_nombre: '', cantidad: 1, precio_unitario: 0 }])
    setSaved(null)
  }

  function handleSubmit() {
    if (!clienteNombre.trim()) { toast.error('Ingresa el nombre del cliente'); return }
    if (items.some((i) => !i.producto_nombre.trim())) { toast.error('Todos los conceptos necesitan descripción'); return }
    if (subtotal === 0) { toast.error('Agrega al menos un concepto con precio'); return }

    startTransition(async () => {
      const result = await crearFactura({
        cliente_nombre: clienteNombre.trim(),
        cliente_rfc: clienteRfc.trim() || undefined,
        items: items.map((i) => ({ ...i, subtotal: calcSubtotal(i) })),
        subtotal,
        iva,
        total,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Factura creada')
        setSaved(result.data as Factura)
      }
    })
  }

  function handleWhatsApp() {
    if (!saved) return
    const folio = String(saved.folio).padStart(4, '0')
    const msg = `*Nota de venta #${folio} - Pollos Gil*\nCliente: ${saved.cliente_nombre}\nTotal: ${formatCurrency(saved.total)}\n\n_Gracias por su compra_ 🐔`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Nueva factura
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-600" />
            {saved ? `Factura #${String(saved.folio).padStart(4, '0')} generada` : 'Nueva nota de venta'}
          </DialogTitle>
        </DialogHeader>

        {saved ? (
          /* ── Post-save state ── */
          <div className="space-y-5 pt-2">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center space-y-1">
              <p className="text-green-700 font-semibold text-lg">¡Factura creada!</p>
              <p className="text-sm text-green-600">
                Folio {String(saved.folio).padStart(4, '0')} · {saved.cliente_nombre} · {formatCurrency(saved.total)}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(`/api/facturas/${saved.id}/pdf`, '_blank')}
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="h-4 w-4" />
                Compartir por WhatsApp
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={resetForm}>
              Crear otra factura
            </Button>
          </div>
        ) : (
          /* ── Form ── */
          <div className="space-y-5 pt-2">
            {/* Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre del cliente *</Label>
                <Input
                  placeholder="Juan García"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>RFC (opcional)</Label>
                <Input
                  placeholder="GAJU800101AAA"
                  value={clienteRfc}
                  onChange={(e) => setClienteRfc(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conceptos</Label>
                <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5 h-7 text-xs">
                  <Plus className="h-3 w-3" /> Agregar
                </Button>
              </div>

              <div className="rounded-lg border overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[2fr_1fr_1.5fr_36px] gap-2 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                  <span>Descripción</span>
                  <span>Cant.</span>
                  <span>Precio unit.</span>
                  <span />
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[2fr_1fr_1.5fr_36px] gap-2 px-3 py-2 border-t items-center">
                    <Input
                      placeholder="Pollo entero..."
                      value={item.producto_nombre}
                      onChange={(e) => updateItem(idx, 'producto_nombre', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => updateItem(idx, 'cantidad', Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.precio_unitario || ''}
                      placeholder="0.00"
                      onChange={(e) => updateItem(idx, 'precio_unitario', Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* IVA toggle + totals */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Incluir IVA (16%)</p>
                  <p className="text-xs text-gray-400">Solo si se requiere para el cliente</p>
                </div>
                <Switch checked={tieneIva} onCheckedChange={setTieneIva} />
              </div>

              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {tieneIva && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>IVA 16%</span>
                    <span>{formatCurrency(iva)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1.5 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-red-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</>
              ) : (
                <><FileText className="h-4 w-4" />Generar factura</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
