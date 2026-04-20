import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TrabajadorCard } from './_components/trabajador-card'
import { AgregarTrabajadorDialog } from './_components/trabajador-dialog'

export default async function TrabajadoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trabajadores = [] } = await supabase
    .from('trabajadores')
    .select('*')
    .order('nombre')

  const activos = trabajadores?.filter((t) => t.activo) ?? []
  const inactivos = trabajadores?.filter((t) => !t.activo) ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trabajadores</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activos.length} activos · {trabajadores?.length ?? 0} total
          </p>
        </div>
        <AgregarTrabajadorDialog />
      </div>

      {(!trabajadores || trabajadores.length === 0) ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <Users className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay trabajadores registrados</p>
            <p className="text-sm text-gray-400 mt-1">
              Agrega tu primer trabajador con el botón de arriba
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activos.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                Activos ({activos.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activos.map((t) => (
                  <TrabajadorCard key={t.id} trabajador={t} />
                ))}
              </div>
            </div>
          )}

          {inactivos.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                Inactivos ({inactivos.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inactivos.map((t) => (
                  <TrabajadorCard key={t.id} trabajador={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
