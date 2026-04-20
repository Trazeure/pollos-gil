import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { FacturaDocument } from '@/app/(dashboard)/facturas/_components/factura-document'
import React from 'react'
import type { Factura } from '@/lib/types'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement, JSXElementConstructor } from 'react'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: factura, error } = await supabase
    .from('facturas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !factura) {
    return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
  }

  const element = React.createElement(
    FacturaDocument,
    { factura: factura as Factura }
  ) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>

  const buffer = await renderToBuffer(element)
  const folio = String(factura.folio).padStart(4, '0')

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${folio}-pollos-gil.pdf"`,
    },
  })
}
