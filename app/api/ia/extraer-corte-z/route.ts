import { NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'

const PROMPT = `Eres un experto en leer tickets de caja registradora de pollerías mexicanas.
Analiza la imagen del ticket (corte X, Y o Z) y extrae todos los productos vendidos.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "items": [
    {
      "producto": "nombre del producto como aparece en el ticket",
      "cantidad": número (piezas o kg),
      "precio_unitario": número en pesos MXN (sin símbolo $),
      "subtotal": número en pesos MXN
    }
  ],
  "total": número total en pesos MXN,
  "fecha": "YYYY-MM-DD o null si no se puede determinar"
}

Reglas:
- Extrae TODOS los productos con cantidad > 0
- Los precios son en pesos mexicanos, sin comas ni símbolo $
- Si el ticket es ilegible o no es de una pollería, devuelve {"items": [], "total": 0, "fecha": null}
- NO incluyas texto fuera del JSON`

export async function POST(request: Request) {
  try {
    const { imageBase64, mimeType } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 })
    }

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType ?? 'image/jpeg'};base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const data = JSON.parse(raw)

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const keyEnd = (process.env.OPENAI_API_KEY ?? '').slice(-4)
    console.error('Error extraer-corte-z:', msg)
    return NextResponse.json({ error: `${msg} [key_end:${keyEnd}]` }, { status: 500 })
  }
}
