'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Phone, DollarSign } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { EditarTrabajadorDialog } from './trabajador-dialog'
import { toggleTrabajadorActivo } from '../actions'
import { formatCurrency } from '@/lib/utils'
import type { Trabajador } from '@/lib/types'

interface TrabajadorCardProps {
  trabajador: Trabajador
}

export function TrabajadorCard({ trabajador }: TrabajadorCardProps) {
  const [activo, setActivo] = useState(trabajador.activo)
  const [isPending, startTransition] = useTransition()

  function handleToggle(checked: boolean) {
    setActivo(checked)
    startTransition(async () => {
      const result = await toggleTrabajadorActivo(trabajador.id, checked)
      if (result.error) {
        toast.error(result.error)
        setActivo(!checked)
      } else {
        toast.success(checked ? 'Trabajador activado' : 'Trabajador dado de baja')
      }
    })
  }

  const initials = trabajador.nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <Card className={`border-0 shadow-sm transition-opacity ${!activo ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-gray-900 truncate">{trabajador.nombre}</p>
              <div className="flex items-center gap-1 shrink-0">
                <EditarTrabajadorDialog trabajador={trabajador} />
                <Switch
                  checked={activo}
                  onCheckedChange={handleToggle}
                  disabled={isPending}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{trabajador.puesto}</p>
            <div className="flex items-center gap-3 mt-2">
              {trabajador.telefono && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Phone size={11} />
                  {trabajador.telefono}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                <DollarSign size={11} />
                {formatCurrency(trabajador.salario)}/sem
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
