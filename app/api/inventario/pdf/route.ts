import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { InventarioDocument } from '@/app/(dashboard)/inventario/_components/inventario-document'
import React from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement, JSXElementConstructor } from 'react'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fecha = searchParams.get('fecha')
  if (!fecha) return NextResponse.json({ error: 'fecha requerida' }, { status: 400 })

  const supabase = await createClient()
  const { data: rec, error } = await supabase
    .from('recibimientos')
    .select('*, recibimiento_items(*)')
    .eq('fecha', fecha)
    .single()

  if (error || !rec) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const items = (rec.recibimiento_items as { tipo: string; kilos: number; precio_kg: number; subtotal: number; descripcion?: string }[]) ?? []

  const pdfData = {
    fecha: rec.fecha,
    items,
    total_dia: rec.total_dia,
  }

  const element = React.createElement(
    InventarioDocument,
    { data: pdfData }
  ) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>

  const buffer = await renderToBuffer(element)

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="inventario-${fecha}-pollos-gil.pdf"`,
    },
  })
}
