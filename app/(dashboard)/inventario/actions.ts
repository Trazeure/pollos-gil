'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const RecibimientoSchema = z.object({
  fecha: z.string().min(1),
  menudencia_kilos: z.coerce.number().min(0).default(0),
  menudencia_precio: z.coerce.number().min(0).default(0),
  seara_kilos: z.coerce.number().min(0).default(0),
  seara_precio: z.coerce.number().min(0).default(0),
  pollo_kilos: z.coerce.number().min(0).default(0),
  pollo_precio: z.coerce.number().min(0).default(0),
})

export async function guardarRecibimiento(_prev: unknown, formData: FormData) {
  const raw = {
    fecha: formData.get('fecha'),
    menudencia_kilos: formData.get('menudencia_kilos'),
    menudencia_precio: formData.get('menudencia_precio'),
    seara_kilos: formData.get('seara_kilos'),
    seara_precio: formData.get('seara_precio'),
    pollo_kilos: formData.get('pollo_kilos'),
    pollo_precio: formData.get('pollo_precio'),
  }

  const parsed = RecibimientoSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const d = parsed.data

  const items = [
    { tipo: 'menudencia', kilos: d.menudencia_kilos, precio_kg: d.menudencia_precio, subtotal: d.menudencia_kilos * d.menudencia_precio },
    { tipo: 'seara',      kilos: d.seara_kilos,      precio_kg: d.seara_precio,      subtotal: d.seara_kilos * d.seara_precio },
    { tipo: 'pollo',      kilos: d.pollo_kilos,      precio_kg: d.pollo_precio,      subtotal: d.pollo_kilos * d.pollo_precio },
  ]
  const total_dia = items.reduce((s, i) => s + i.subtotal, 0)

  // Upsert recibimiento por fecha
  const { data: rec, error: recError } = await supabase
    .from('recibimientos')
    .upsert({ fecha: d.fecha, total_dia, created_by: user.id }, { onConflict: 'fecha' })
    .select('id')
    .single()

  if (recError || !rec) return { error: recError?.message ?? 'Error al guardar' }

  // Borrar items anteriores y reinsertar
  await supabase.from('recibimiento_items').delete().eq('recibimiento_id', rec.id)
  const { error: itemsError } = await supabase
    .from('recibimiento_items')
    .insert(items.map((i) => ({ ...i, recibimiento_id: rec.id })))

  if (itemsError) return { error: itemsError.message }

  revalidatePath('/inventario')
  revalidatePath('/')
  return { ok: true }
}
