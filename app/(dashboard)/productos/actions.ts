'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ProductoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoria: z.string().min(1, 'La categoría es requerida'),
  precio: z.coerce.number().min(0, 'El precio debe ser mayor a 0'),
  unidad: z.string().min(1, 'La unidad es requerida'),
})

export async function actualizarPrecio(id: string, precio: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('productos')
    .update({ precio })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/productos')
  return { ok: true }
}

export async function toggleActivo(id: string, activo: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('productos')
    .update({ activo })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/productos')
  return { ok: true }
}

export async function crearProducto(_prev: unknown, formData: FormData) {
  const raw = {
    nombre: formData.get('nombre'),
    categoria: formData.get('categoria'),
    precio: formData.get('precio'),
    unidad: formData.get('unidad'),
  }

  const parsed = ProductoSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('productos').insert(parsed.data)

  if (error) return { error: error.message }
  revalidatePath('/productos')
  return { ok: true }
}

export async function editarProducto(_prev: unknown, formData: FormData) {
  const id = formData.get('id') as string
  const raw = {
    nombre: formData.get('nombre'),
    categoria: formData.get('categoria'),
    precio: formData.get('precio'),
    unidad: formData.get('unidad'),
  }

  const parsed = ProductoSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('productos').update(parsed.data).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/productos')
  return { ok: true }
}
