'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const TrabajadorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  puesto: z.string().min(1, 'El puesto es requerido'),
  telefono: z.string().optional(),
  salario: z.coerce.number().min(0, 'El salario debe ser mayor a 0'),
})

export async function crearTrabajador(_prev: unknown, formData: FormData) {
  const raw = {
    nombre: formData.get('nombre'),
    puesto: formData.get('puesto'),
    telefono: formData.get('telefono') || undefined,
    salario: formData.get('salario'),
  }

  const parsed = TrabajadorSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('trabajadores').insert(parsed.data)

  if (error) return { error: error.message }
  revalidatePath('/trabajadores')
  return { ok: true }
}

export async function editarTrabajador(_prev: unknown, formData: FormData) {
  const id = formData.get('id') as string
  const raw = {
    nombre: formData.get('nombre'),
    puesto: formData.get('puesto'),
    telefono: formData.get('telefono') || undefined,
    salario: formData.get('salario'),
  }

  const parsed = TrabajadorSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('trabajadores').update(parsed.data).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/trabajadores')
  return { ok: true }
}

export async function toggleTrabajadorActivo(id: string, activo: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('trabajadores').update({ activo }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/trabajadores')
  return { ok: true }
}
