'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog'
import { crearTrabajador, editarTrabajador } from '../actions'
import type { Trabajador } from '@/lib/types'

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="bg-red-600 hover:bg-red-700 text-white">
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      {label}
    </Button>
  )
}

function TrabajadorForm({
  action,
  trabajador,
  onSuccess,
}: {
  action: (prev: unknown, fd: FormData) => Promise<{ ok?: boolean; error?: string }>
  trabajador?: Trabajador
  onSuccess: () => void
}) {
  const [state, formAction] = useFormState(action, null)

  useEffect(() => {
    if (state && 'ok' in state && state.ok) {
      toast.success(trabajador ? 'Trabajador actualizado' : 'Trabajador agregado')
      onSuccess()
    }
    if (state && 'error' in state && state.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-4">
      {trabajador && <input type="hidden" name="id" value={trabajador.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre completo</Label>
          <Input
            id="nombre"
            name="nombre"
            placeholder="Ej: Juan García"
            defaultValue={trabajador?.nombre}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="puesto">Puesto</Label>
          <Input
            id="puesto"
            name="puesto"
            placeholder="Ej: Carnicero"
            defaultValue={trabajador?.puesto}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            name="telefono"
            type="tel"
            placeholder="8661234567"
            defaultValue={trabajador?.telefono}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="salario">Salario semanal (MXN)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <Input
              id="salario"
              name="salario"
              type="number"
              min="0"
              step="50"
              placeholder="0.00"
              defaultValue={trabajador?.salario}
              className="pl-7"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild>
          <Button variant="outline" type="button">Cancelar</Button>
        </DialogClose>
        <SubmitBtn label={trabajador ? 'Guardar cambios' : 'Agregar trabajador'} />
      </div>
    </form>
  )
}

export function AgregarTrabajadorDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
          <Plus size={16} />
          Agregar trabajador
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo trabajador</DialogTitle>
        </DialogHeader>
        <TrabajadorForm action={crearTrabajador} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function EditarTrabajadorDialog({ trabajador }: { trabajador: Trabajador }) {
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
          <DialogTitle>Editar trabajador</DialogTitle>
        </DialogHeader>
        <TrabajadorForm
          action={editarTrabajador}
          trabajador={trabajador}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
