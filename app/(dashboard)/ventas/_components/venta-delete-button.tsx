'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarVenta } from '../actions'

export function VentaDeleteButton({ id, fecha }: { id: string; fecha: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirming) { setConfirming(true); setTimeout(() => setConfirming(false), 3000); return }
    startTransition(async () => {
      const result = await eliminarVenta(id)
      if (result.error) toast.error(result.error)
      else toast.success(`Venta del ${fecha} eliminada`)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`shrink-0 h-7 w-7 flex items-center justify-center rounded-lg transition-all ${
        confirming
          ? 'bg-red-500 text-white scale-110'
          : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
      }`}
      title={confirming ? 'Toca de nuevo para confirmar' : 'Eliminar venta'}
    >
      {isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
    </button>
  )
}
