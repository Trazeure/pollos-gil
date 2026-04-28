import { NextResponse } from 'next/server'
import { getGemini } from '@/lib/gemini'
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

    const porProducto: Record<string, { total_cantidad: number; total_monto: number }> = {}
    ventas?.forEach((v) => {
      const items = (v.items as { producto_nombre: string; cantidad: number; subtotal: number }[]) ?? []
      items.forEach((i) => {
        if (!porProducto[i.producto_nombre]) porProducto[i.producto_nombre] = { total_cantidad: 0, total_monto: 0 }
        porProducto[i.producto_nombre].total_cantidad += i.cantidad
        porProducto[i.producto_nombre].total_monto += i.subtotal
      })
    })

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
Analiza los datos de Pollos Gil (Monclova, Coahuila) de las últimas 4 semanas.

VENTAS POR PRODUCTO: ${JSON.stringify(porProducto)}
INVENTARIO: ${JSON.stringify(porTipo)}
REGISTROS: ${ventas?.length ?? 0} días de ventas, ${recibimientos?.length ?? 0} días de inventario.

Responde ÚNICAMENTE con este JSON sin texto extra:
{"recomendaciones":["rec1","rec2","rec3","rec4"],"cantidad_sugerida_kg":{"menudencia":número,"seara":número,"pollo":número},"productos_estrella":["p1","p2","p3"],"productos_baja_rotacion":["p1","p2"],"razonamiento":"análisis breve"}`

    const model = getGemini().getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as never,
    })

    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const data = JSON.parse(cleaned)

    return NextResponse.json({ ...data, generado_en: new Date().toISOString() })
  } catch (err) {
    console.error('Error sugerencias:', err)
    return NextResponse.json({ error: 'Error al generar sugerencias' }, { status: 500 })
  }
}
