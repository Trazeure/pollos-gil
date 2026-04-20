'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Phone, Calendar, MessageCircle, Trash2, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import { actualizarEstado, eliminarPedido } from '../actions'
import type { Pedido, EstadoPedido } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const ESTADO_CONFIG: Record<EstadoPedido, { label: string; bg: string; text: string; border: string }> = {
  pagado:   { label: 'Pagado',   bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  pendiente:{ label: 'Pendiente',bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  a_deber:  { label: 'A Deber',  bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
}

const ESTADOS_LIST: EstadoPedido[] = ['pendiente', 'pagado', 'a_deber']

export function PedidoCard({ pedido }: { pedido: Pedido }) {
  const [estado, setEstado] = useState<EstadoPedido>(pedido.estado)
  const [showMenu, setShowMenu] = useState(false)
  const [isPending, startTransition] = useTransition()

  const cfg = ESTADO_CONFIG[estado]

  function handleEstado(nuevoEstado: EstadoPedido) {
    setShowMenu(false)
    if (nuevoEstado === estado) return
    const prev = estado
    setEstado(nuevoEstado)
    startTransition(async () => {
      const result = await actualizarEstado(pedido.id, nuevoEstado)
      if (result.error) { toast.error(result.error); setEstado(prev) }
      else toast.success('Estado actualizado')
    })
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar pedido de ${pedido.cliente}?`)) return
    startTransition(async () => {
      const result = await eliminarPedido(pedido.id)
      if (result.error) toast.error(result.error)
      else toast.success('Pedido eliminado')
    })
  }

  const waMsg = `Hola ${pedido.cliente}, su pedido de Pollos Gil está *${ESTADO_CONFIG[estado].label}*.\nTotal: ${formatCurrency(pedido.total)}\n\n_Pollos Gil · Monclova_`

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-bold text-gray-900">{pedido.cliente}</p>
            {pedido.telefono && (
              <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <Phone className="h-3 w-3" />{pedido.telefono}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Estado badge con dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={cn('flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-semibold transition-all', cfg.bg, cfg.text, cfg.border)}
              >
                {cfg.label}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 min-w-[120px]">
                  {ESTADOS_LIST.map((e) => (
                    <button
                      key={e}
                      onClick={() => handleEstado(e)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors',
                        ESTADO_CONFIG[e].text,
                        e === estado && 'bg-gray-50'
                      )}
                    >
                      {ESTADO_CONFIG[e].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items summary */}
        <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
          {pedido.items.slice(0, 3).map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-0.5">
              <span className="text-gray-600">{item.producto_nombre} ×{item.cantidad}</span>
              <span className="text-gray-800 font-medium">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
          {pedido.items.length > 3 && (
            <p className="text-xs text-gray-400 mt-1">+{pedido.items.length - 3} más</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-black text-gray-900">{formatCurrency(pedido.total)}</p>
            {pedido.fecha_entrega && (
              <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <Calendar className="h-3 w-3" />
                {format(parseISO(pedido.fecha_entrega), "d MMM", { locale: es })}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {pedido.telefono && (
              <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1 text-xs text-green-600 border-green-200 hover:bg-green-50" asChild>
                <a href={`https://wa.me/52${pedido.telefono.replace(/\D/g,'')}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-3.5 w-3.5" />WA
                </a>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {pedido.notas && (
          <p className="text-xs text-gray-400 mt-2 border-t pt-2">{pedido.notas}</p>
        )}
      </CardContent>
    </Card>
  )
}
