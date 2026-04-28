import { NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { subWeeks, format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const desde = format(subWeeks(new Date(), 4), 'yyyy-MM-dd')

    const [{ data: ventas }, { data: recibimientos }] = await Promise.all([
      supabase.from('ventas').select('fecha, items, total').gte('fecha', desde).order('fecha'),
      supabase.from('recibimientos').select('fecha, total_dia, recibimiento_items(*)').gte('fecha', desde).order('fecha'),
    ])

    // Agregar ventas por producto
    const porProducto: Record<string, { total_cantidad: number; total_monto: number }> = {}
    ventas?.forEach((v) => {
      const items = (v.items as { producto_nombre: string; cantidad: number; subtotal: number }[]) ?? []
      items.forEach((i) => {
        if (!porProducto[i.producto_nombre]) porProducto[i.producto_nombre] = { total_cantidad: 0, total_monto: 0 }
        porProducto[i.producto_nombre].total_cantidad += i.cantidad
        porProducto[i.producto_nombre].total_monto += i.subtotal
      })
    })

    // Agregar inventario por tipo
    const porTipo: Record<string, { total_kilos: number; precio_promedio: number; dias: number }> = {}
    recibimientos?.forEach((r) => {
      const items = (r.recibimiento_items as { tipo: string; kilos: number; precio_kg: number }[]) ?? []
      items.forEach((i) => {
        if (!porTipo[i.tipo]) porTipo[i.tipo] = { total_kilos: 0, precio_promedio: 0, dias: 0 }
        porTipo[i.tipo].total_kilos += i.kilos
        porTipo[i.tipo].precio_promedio = ((porTipo[i.tipo].precio_promedio * porTipo[i.tipo].dias) + i.precio_kg) / (porTipo[i.tipo].dias + 1)
        porTipo[i.tipo].dias += 1
      })
    })

    const prompt = `Eres un asesor de negocios especializado en pollerías mexicanas.
Analiza los siguientes datos de Pollos Gil (Monclova, Coahuila) de las últimas 4 semanas y genera recomendaciones concretas.

VENTAS POR PRODUCTO (últimas 4 semanas):
${JSON.stringify(porProducto, null, 2)}

INVENTARIO RECIBIDO (últimas 4 semanas):
${JSON.stringify(porTipo, null, 2)}

TOTAL DE REGISTROS: ${ventas?.length ?? 0} días de ventas, ${recibimientos?.length ?? 0} días de recibimiento.

Responde ÚNICAMENTE con un JSON válido:
{
  "recomendaciones": [
    "recomendación concreta 1",
    "recomendación concreta 2",
    "recomendación concreta 3",
    "recomendación concreta 4"
  ],
  "cantidad_sugerida_kg": {
    "menudencia": número (kg para la próxima semana),
    "seara": número (kg para la próxima semana),
    "pollo": número (kg para la próxima semana)
  },
  "productos_estrella": ["producto1", "producto2", "producto3"],
  "productos_baja_rotacion": ["producto1", "producto2"],
  "razonamiento": "análisis breve de 2-3 oraciones en español mexicano"
}`

    const completion = await getOpenAI().chat.completions.create({
      model: 'gemini-2.0-flash',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    })

    const data = JSON.parse(completion.choices[0].message.content ?? '{}')
    return NextResponse.json({ ...data, generado_en: new Date().toISOString() })
  } catch (err) {
    console.error('Error sugerencias:', err)
    return NextResponse.json({ error: 'Error al generar sugerencias' }, { status: 500 })
  }
}
