import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { AsistenciasClient } from './_components/asistencias-client'

export default async function AsistenciasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const hoy = format(new Date(), 'yyyy-MM-dd')

  const [{ data: trabajadores }, { data: asistenciasHoy }] = await Promise.all([
    supabase.from('trabajadores').select('*').eq('activo', true).order('nombre'),
    supabase.from('asistencias').select('*').eq('fecha', hoy),
  ])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asistencias</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Marca la asistencia diaria de tus trabajadores
        </p>
      </div>
      <AsistenciasClient
        trabajadores={trabajadores ?? []}
        asistenciasHoy={asistenciasHoy ?? []}
      />
    </div>
  )
}
