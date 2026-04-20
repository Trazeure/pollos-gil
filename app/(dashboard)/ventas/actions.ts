'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const VentaItemSchema = z.object({
  producto_id: z.string(),
  producto_nombre: z.string(),
  cantidad: z.coerce.number().min(0),
  precio_unitario: z.coerce.number().min(0),
  subtotal: z.coerce.number().min(0),
})

const VentaSchema = z.object({
  fecha: z.string(),
  items: z.array(VentaItemSchema),
  total: z.coerce.number().min(0),
})

export async function guardarVenta(_prev: unknown, formData: FormData) {
  const itemsRaw = formData.get('items')
  const fecha = formData.get('fecha') as string

  if (!itemsRaw) return { error: 'Sin items' }

  let items
  try {
    items = JSON.parse(itemsRaw as string)
  } catch {
    return { error: 'Datos inválidos' }
  }

  const filteredItems = items.filter((i: { cantidad: number }) => i.cantidad > 0)
  if (filteredItems.length === 0) return { error: 'Agrega al menos un producto con cantidad mayor a 0' }

  const total = filteredItems.reduce(
    (sum: number, i: { subtotal: number }) => sum + i.subtotal,
    0
  )

  const parsed = VentaSchema.safeParse({ fecha, items: filteredItems, total })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('ventas').insert({
    fecha: parsed.data.fecha,
    items: parsed.data.items,
    total: parsed.data.total,
    metodo: 'manual',
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/ventas')
  revalidatePath('/')
  return { ok: true }
}
