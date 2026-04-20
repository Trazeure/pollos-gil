'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EstadoAsistencia } from '@/lib/types'

export async function marcarAsistencia(
  trabajadorId: string,
  fecha: string,
  estado: EstadoAsistencia,
  notas?: string
) {
  const supabase = await createClient()
  const { error } = await supabase.from('asistencias').upsert(
    { trabajador_id: trabajadorId, fecha, estado, notas: notas ?? null },
    { onConflict: 'trabajador_id,fecha' }
  )
  if (error) return { error: error.message }
  revalidatePath('/asistencias')
  return { success: true }
}

export async function borrarAsistencia(trabajadorId: string, fecha: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('asistencias')
    .delete()
    .eq('trabajador_id', trabajadorId)
    .eq('fecha', fecha)
  if (error) return { error: error.message }
  revalidatePath('/asistencias')
  return { success: true }
}

export async function getResumenMes(anio: number, mes: number) {
  const supabase = await createClient()
  const desde = `${anio}-${String(mes).padStart(2, '0')}-01`
  const hasta = `${anio}-${String(mes).padStart(2, '0')}-31`
  const { data } = await supabase
    .from('asistencias')
    .select('trabajador_id, fecha, estado')
    .gte('fecha', desde)
    .lte('fecha', hasta)
  return data ?? []
}
