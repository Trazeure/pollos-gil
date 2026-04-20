'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EstadoPedido, PedidoItem } from '@/lib/types'

export async function crearPedido(data: {
  cliente: string
  telefono?: string
  items: PedidoItem[]
  total: number
  estado: EstadoPedido
  fecha_entrega?: string
  notas?: string
}) {
  const supabase = await createClient()
  const { data: pedido, error } = await supabase.from('pedidos').insert(data).select().single()
  if (error) return { error: error.message }
  revalidatePath('/pedidos')
  return { data: pedido }
}

export async function actualizarEstado(id: string, estado: EstadoPedido) {
  const supabase = await createClient()
  const { error } = await supabase.from('pedidos').update({ estado }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/pedidos')
  return { success: true }
}

export async function eliminarPedido(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('pedidos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/pedidos')
  return { success: true }
}
