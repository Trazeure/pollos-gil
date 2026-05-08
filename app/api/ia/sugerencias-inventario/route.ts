import { NextResponse } from 'next/server'
import { getGemini } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'
import { format, subDays, addDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

// ── Mexican holidays (fixed + year-specific) ──────────────────────────────────
const FESTIVOS_FIJOS: Record<string, string> = {
  '01-01': 'Año Nuevo',
  '05-01': 'Día del Trabajo',
  '05-10': 'Día de las Madres',
  '09-16': 'Día de la Independencia',
  '11-01': 'Día de Muertos',
  '11-02': 'Día de Muertos',
  '12-12': 'Virgen de Guadalupe',
  '12-24': 'Nochebuena',
  '12-25': 'Navidad',
  '12-31': 'Fin de Año',
}
const FESTIVOS_ESPECIFICOS: Record<string, string> = {
  '2025-02-03': 'Día de la Constitución',
  '2025-03-17': 'Natalicio Benito Juárez',
  '2025-04-17': 'Jueves Santo',
  '2025-04-18': 'Viernes Santo',
  '2025-11-17': 'Revolución Mexicana',
  '2026-02-02': 'Día de la Constitución',
  '2026-03-16': 'Natalicio Benito Juárez',
  '2026-04-02': 'Jueves Santo',
  '2026-04-03': 'Viernes Santo',
  '2026-11-16': 'Revolución Mexicana',
}

function getFestivoProximo(base: Date): string | null {
  for (let i = 0; i <= 5; i++) {
    const d = addDays(base, i)
    const mmdd = format(d, 'MM-dd')
    const full = format(d, 'yyyy-MM-dd')
    const nombre = FESTIVOS_FIJOS[mmdd] ?? FESTIVOS_ESPECIFICOS[full]
    if (nombre) {
      const cuando = i === 0 ? 'HOY' : i === 1 ? 'mañana' : `en ${i} días`
      return `${nombre} (${cuando}, ${format(d, "d 'de' MMMM", { locale: es })})`
    }
  }
  return null
}

// ── Quincena cycle ─────────────────────────────────────────────────────────────
function getEstadoQuincena(date: Date) {
  const dia = date.getDate()
  if (dia === 15 || dia === 1) return { estado: 'quincena', label: 'Día de quincena', factor: 1.4 }
  if ([14, 16, 29, 30, 31].includes(dia)) return { estado: 'quincena_cercana', label: 'Próximo a quincena', factor: 1.25 }
  if ([12, 13, 27, 28].includes(dia)) return { estado: 'fondo_quincena', label: 'Fondo de quincena', factor: 0.82 }
  return { estado: 'normal', label: 'Período normal', factor: 1.0 }
}

// ── Weather ────────────────────────────────────────────────────────────────────
async function getWeather(): Promise<{ temp: number; descripcion: string; impacto: string }> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=26.9&longitude=-101.42&current=temperature_2m,weather_code&timezone=America/Monterrey',
      { next: { revalidate: 1800 } }
    )
    const json = await res.json()
    const temp = Math.round(json.current?.temperature_2m ?? 25)
    const code = json.current?.weather_code ?? 0
    let desc = 'Despejado'
    if (code >= 71) desc = 'Nevando'
    else if (code >= 61) desc = 'Lluvia'
    else if (code >= 51) desc = 'Llovizna'
    else if (code >= 45) desc = 'Niebla'
    else if (code >= 2) desc = 'Nublado'

    let impacto = 'neutro en demanda'
    if (temp >= 38) impacto = 'calor extremo — sube demanda de pollo fresco'
    else if (temp >= 32) impacto = 'calor — leve aumento en demanda'
    else if (code >= 61) impacto = 'lluvia — posible caída de afluencia'
    else if (temp < 15) impacto = 'frío — preferencia por guisos calientes'

    return { temp, descripcion: `${desc}, ${temp}°C`, impacto }
  } catch {
    return { temp: 28, descripcion: 'Sin datos', impacto: 'desconocido' }
  }
}

// ── Main handler ───────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const stockManual: Record<string, number | null> = {
      menudencia: searchParams.has('menudencia') ? Math.max(0, parseInt(searchParams.get('menudencia')!)) : null,
      seara:      searchParams.has('seara')      ? Math.max(0, parseInt(searchParams.get('seara')!))      : null,
      pollo:      searchParams.has('pollo')      ? Math.max(0, parseInt(searchParams.get('pollo')!))      : null,
    }

    const now = new Date()
    const tomorrow = addDays(now, 1)
    const hace90 = format(subDays(now, 90), 'yyyy-MM-dd')
    const hace7 = format(subDays(now, 7), 'yyyy-MM-dd')
    const hace14 = format(subDays(now, 14), 'yyyy-MM-dd')
    const today = format(now, 'yyyy-MM-dd')

    const [
      { data: ventas },
      { data: recibimientos },
      weather,
    ] = await Promise.all([
      supabase.from('ventas').select('fecha, total').gte('fecha', hace90).order('fecha'),
      supabase.from('recibimientos').select('fecha, recibimiento_items(tipo, kilos, precio_kg)').gte('fecha', hace90).order('fecha', { ascending: false }),
      getWeather(),
    ])

    const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

    // ── Day-of-week patterns ─────────────────────────────────────────────────
    const porDia: Record<number, { suma: number; n: number }> = {}
    ventas?.forEach(v => {
      const d = new Date(v.fecha + 'T12:00:00').getDay()
      porDia[d] = porDia[d] ?? { suma: 0, n: 0 }
      porDia[d].suma += v.total
      porDia[d].n++
    })
    const promediosDia = DIAS.map((nombre, i) => {
      const s = porDia[i]
      return { dia: nombre, promedio: s ? Math.round(s.suma / s.n) : 0, registros: s?.n ?? 0 }
    }).filter(d => d.registros > 0)

    // ── Quincena cycle patterns ──────────────────────────────────────────────
    const quincenaBuckets: Record<string, { suma: number; n: number }> = {
      'Inicio de quincena (días 1-3, 15-17)': { suma: 0, n: 0 },
      'Período normal': { suma: 0, n: 0 },
      'Fondo de quincena (días 12-14, 27-28)': { suma: 0, n: 0 },
      'Cierre de mes (29-31)': { suma: 0, n: 0 },
    }
    ventas?.forEach(v => {
      const dia = parseInt(v.fecha.substring(8, 10))
      let bucket: string
      if ([1, 2, 3, 15, 16, 17].includes(dia)) bucket = 'Inicio de quincena (días 1-3, 15-17)'
      else if ([12, 13, 14, 27, 28].includes(dia)) bucket = 'Fondo de quincena (días 12-14, 27-28)'
      else if (dia >= 29) bucket = 'Cierre de mes (29-31)'
      else bucket = 'Período normal'
      quincenaBuckets[bucket].suma += v.total
      quincenaBuckets[bucket].n++
    })
    const patronesQuincena = Object.entries(quincenaBuckets)
      .filter(([, s]) => s.n > 0)
      .map(([nombre, s]) => ({ nombre, promedio: Math.round(s.suma / s.n), registros: s.n }))

    // ── Weekly trend ─────────────────────────────────────────────────────────
    const ventasUlt7 = ventas?.filter(v => v.fecha >= hace7 && v.fecha < today) ?? []
    const ventasPrev7 = ventas?.filter(v => v.fecha >= hace14 && v.fecha < hace7) ?? []
    const avgUlt7 = ventasUlt7.length ? ventasUlt7.reduce((s, v) => s + v.total, 0) / ventasUlt7.length : 0
    const avgPrev7 = ventasPrev7.length ? ventasPrev7.reduce((s, v) => s + v.total, 0) / ventasPrev7.length : 0
    const tendenciaPct = avgPrev7 > 0 ? ((avgUlt7 - avgPrev7) / avgPrev7) * 100 : 0

    // ── Stock estimation ──────────────────────────────────────────────────────
    type StockInfo = {
      ultimaFecha: string; ultimosKilos: number; precioUlt: number
      totalKilos: number; compras: number; minPedido: number; maxPedido: number
    }
    const tipos = ['menudencia', 'seara', 'pollo'] as const
    const stock: Record<string, StockInfo> = {
      menudencia: { ultimaFecha: '', ultimosKilos: 0, precioUlt: 0, totalKilos: 0, compras: 0, minPedido: Infinity, maxPedido: 0 },
      seara:      { ultimaFecha: '', ultimosKilos: 0, precioUlt: 0, totalKilos: 0, compras: 0, minPedido: Infinity, maxPedido: 0 },
      pollo:      { ultimaFecha: '', ultimosKilos: 0, precioUlt: 0, totalKilos: 0, compras: 0, minPedido: Infinity, maxPedido: 0 },
    }

    recibimientos?.forEach(r => {
      const items = (r.recibimiento_items as { tipo: string; kilos: number; precio_kg: number }[]) ?? []
      items.forEach(item => {
        if (!tipos.includes(item.tipo as typeof tipos[number])) return
        const s = stock[item.tipo]
        s.totalKilos += item.kilos
        s.compras++
        if (item.kilos > 0) {
          s.minPedido = Math.min(s.minPedido, item.kilos)
          s.maxPedido = Math.max(s.maxPedido, item.kilos)
        }
        if (!s.ultimaFecha || r.fecha > s.ultimaFecha) {
          s.ultimaFecha = r.fecha
          s.ultimosKilos = item.kilos
          s.precioUlt = item.precio_kg
        }
      })
    })

    // 90 days / 7 = ~12.86 weeks — use real elapsed weeks, NOT record count
    const numSemanas = 90 / 7

    const stockEstimado: Record<string, number> = {}
    for (const tipo of tipos) {
      if (stockManual[tipo] !== null) {
        stockEstimado[tipo] = stockManual[tipo] as number
        continue
      }
      const s = stock[tipo]
      if (!s.ultimaFecha) { stockEstimado[tipo] = 0; continue }
      const diasDesde = Math.floor((new Date(today).getTime() - new Date(s.ultimaFecha).getTime()) / 86400000)
      const promDiario = (s.totalKilos / numSemanas) / 7
      stockEstimado[tipo] = Math.max(0, Math.round(s.ultimosKilos - diasDesde * promDiario))
    }

    const resumenStock = tipos.map(tipo => {
      const s = stock[tipo]
      const semAvg = s.totalKilos / numSemanas
      const diasDesde = s.ultimaFecha
        ? Math.floor((new Date(today).getTime() - new Date(s.ultimaFecha).getTime()) / 86400000)
        : null
      const minP = s.minPedido === Infinity ? 0 : s.minPedido
      return {
        tipo,
        ultimaCompra: s.ultimaFecha ? `hace ${diasDesde} día(s) — ${s.ultimosKilos}kg a $${s.precioUlt}/kg` : 'Sin registros',
        promedioSemanal: Math.round(semAvg),
        stockEstimado: stockEstimado[tipo],
        rangoPedido: s.compras > 0 ? `${minP}–${s.maxPedido}kg (en ${s.compras} pedidos registrados)` : 'Sin datos',
        pedidoTipico: s.compras > 0 ? Math.round(s.totalKilos / s.compras) : 0,
      }
    })

    // ── Tomorrow's context ────────────────────────────────────────────────────
    const quincenaCtx = getEstadoQuincena(tomorrow)
    const festivoProximo = getFestivoProximo(now)
    const diaMañana = DIAS[tomorrow.getDay()]
    const fechaMañana = format(tomorrow, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })

    // ── Build prompt ──────────────────────────────────────────────────────────
    const prompt = `Eres el asesor de compras de Pollos Gil, una pollería familiar en Monclova, Coahuila.
Tu misión: recomendar exactamente cuántos kilos comprar de menudencia, seara (pechuga) y pollo entero.
Esta recomendación es para MAÑANA (${fechaMañana}).

=== CONTEXTO DE MAÑANA ===
• Día: ${diaMañana}
• Estado quincenal: ${quincenaCtx.label} (factor de demanda ~${quincenaCtx.factor}x)
• Clima hoy en Monclova: ${weather.descripcion} → ${weather.impacto}
• Días festivos próximos: ${festivoProximo ?? 'Ninguno en los próximos 5 días'}

=== PATRONES HISTÓRICOS POR DÍA DE SEMANA ===
${promediosDia.map(d => `${d.dia}: $${d.promedio.toLocaleString()} promedio (${d.registros} registros)`).join('\n')}

=== EFECTO QUINCENAL ===
${patronesQuincena.map(p => `${p.nombre}: $${p.promedio.toLocaleString()} promedio (${p.registros} registros)`).join('\n')}

=== STOCK ACTUAL ===
${resumenStock.map(s => {
  const etiqueta = stockManual[s.tipo] !== null ? 'ingresado manualmente (dato real)' : 'estimado automáticamente (menos confiable)'
  return `${s.tipo}: ${s.stockEstimado}kg [${etiqueta}] | Última compra: ${s.ultimaCompra} | Promedio semanal: ${s.promedioSemanal}kg/semana`
}).join('\n')}

=== RANGOS REALES DE PEDIDO (historial de compras) ===
${resumenStock.map(s => `${s.tipo}: pedido típico ${s.pedidoTipico}kg | rango histórico: ${s.rangoPedido}`).join('\n')}
IMPORTANTE: Estos son los rangos reales de compra de este negocio. Cualquier sugerencia fuera de este rango es un error.

=== TENDENCIA RECIENTE ===
Últimos 7 días: $${Math.round(avgUlt7).toLocaleString()} promedio diario
7 días anteriores: $${Math.round(avgPrev7).toLocaleString()} promedio diario
Tendencia: ${tendenciaPct >= 0 ? '+' : ''}${tendenciaPct.toFixed(1)}% ${tendenciaPct >= 5 ? '(creciendo)' : tendenciaPct <= -5 ? '(bajando)' : '(estable)'}

=== REGLAS DE DECISIÓN ===
⚠️ RESTRICCIÓN CRÍTICA: Nunca sugerir kilos fuera del rango histórico de pedido mostrado arriba. Si el rango de pollo es 150–200kg, sugerir DENTRO de ese rango ajustado por contexto, nunca 245kg ni ninguna cifra fuera del rango. El pedido típico es la referencia base.
1. Comprar = stock estimado actual es bajo (< 1 día de consumo) O mañana es día de alta demanda
2. Calor extremo (+36°C) sube demanda de pollo fresco ~15-20%
3. Día de quincena: comprar ~35-40% más del pedido típico (sin exceder el máximo histórico)
4. Fondo de quincena: comprar ~15-20% menos del pedido típico (sin bajar del mínimo histórico)
5. Festivo o víspera festiva: comprar 25-50% más según el festivo (sin exceder el máximo histórico)
6. Sábados y domingos: suelen ser los días de mayor venta
7. No sugerir comprar lo que ya tienen suficiente en stock
8. El objetivo: cero desperdicio y nunca quedarse sin producto

Responde ÚNICAMENTE con este JSON (sin texto extra, sin markdown):
{
  "compras_sugeridas": {
    "menudencia": {"kilos": número, "confianza": "alta|media|baja", "razon": "frase corta explicando el por qué"},
    "seara": {"kilos": número, "confianza": "alta|media|baja", "razon": "frase corta"},
    "pollo": {"kilos": número, "confianza": "alta|media|baja", "razon": "frase corta"}
  },
  "contexto_detectado": {
    "dia_semana": "${diaMañana}",
    "estado_quincena": "${quincenaCtx.estado}",
    "clima": "${weather.descripcion}",
    "festivo_proximo": ${festivoProximo ? `"${festivoProximo}"` : 'null'}
  },
  "alerta": "mensaje de alerta si hay algo importante (quincena + festivo + calor extremo), o null",
  "patrones_aprendidos": ["patrón 1 detectado en los datos", "patrón 2", "patrón 3"],
  "razonamiento": "análisis en 120-150 palabras explicando el razonamiento detrás de cada cifra"
}`

    const model = getGemini().getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { thinkingConfig: { thinkingBudget: 5000 } } as never,
    })

    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const data = JSON.parse(cleaned)

    // Ensure kg suggestions are always whole numbers
    for (const tipo of tipos) {
      if (data.compras_sugeridas?.[tipo]) {
        data.compras_sugeridas[tipo].kilos = Math.round(data.compras_sugeridas[tipo].kilos)
      }
    }

    return NextResponse.json({
      ...data,
      stock_estimado: stockEstimado,
      generado_en: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Error sugerencias inventario:', err)
    return NextResponse.json({ error: 'Error al generar sugerencias' }, { status: 500 })
  }
}
