'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { eliminarRecibimiento } from '../actions'

export function HistorialDeleteButton({ id, fecha }: { id: string; fecha: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`¿Eliminar recibimiento del ${fecha}?\nSe borrarán todos los datos registrados ese día.`)) return
    startTransition(async () => {
      const result = await eliminarRecibimiento(id)
      if (result.error) toast.error(result.error)
      else toast.success('Recibimiento eliminado')
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Trash2 className="h-3.5 w-3.5" />
      }
    </Button>
  )
}
