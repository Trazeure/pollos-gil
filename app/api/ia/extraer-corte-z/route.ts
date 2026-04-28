import { NextResponse } from 'next/server'
import { getGemini } from '@/lib/gemini'

const PROMPT = `Eres un experto en leer tickets de caja registradora de pollerías mexicanas.
Analiza la imagen del ticket (corte X, Y o Z) y extrae todos los productos vendidos.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta, sin texto adicional:
{"items":[{"producto":"nombre","cantidad":número,"precio_unitario":número,"subtotal":número}],"total":número,"fecha":"YYYY-MM-DD o null"}

Reglas:
- Extrae TODOS los productos con cantidad > 0
- Precios en pesos mexicanos sin comas ni símbolo $
- Si el ticket es ilegible devuelve: {"items":[],"total":0,"fecha":null}
- Responde SOLO con el JSON, sin markdown`

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { imageBase64, mimeType } = await request.json()
    if (!imageBase64) return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 })

    const model = getGemini().getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as never,
    })

    const result = await model.generateContent([
      PROMPT,
      { inlineData: { data: imageBase64, mimeType: mimeType ?? 'image/jpeg' } },
    ])

    const raw = result.response.text().trim()
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const data = JSON.parse(cleaned)

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Error extraer-corte-z:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
