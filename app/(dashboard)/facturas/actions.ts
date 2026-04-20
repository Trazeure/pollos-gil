'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FacturaItem } from '@/lib/types'

export async function crearFactura(data: {
  cliente_nombre: string
  cliente_rfc?: string
  items: FacturaItem[]
  subtotal: number
  iva: number
  total: number
}) {
  const supabase = await createClient()
  const { data: factura, error } = await supabase
    .from('facturas')
    .insert(data)
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/facturas')
  return { data: factura }
}

export async function eliminarFactura(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('facturas').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/facturas')
  return { success: true }
}
