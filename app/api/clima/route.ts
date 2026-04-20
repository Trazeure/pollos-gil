import { NextResponse } from 'next/server'
import { MONCLOVA_COORDS } from '@/lib/constants'

const WMO_CODES: Record<number, string> = {
  0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
  45: 'Neblina', 48: 'Neblina con escarcha',
  51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna densa',
  61: 'Lluvia ligera', 63: 'Lluvia moderada', 65: 'Lluvia fuerte',
  71: 'Nevada ligera', 73: 'Nevada moderada', 75: 'Nevada fuerte',
  80: 'Chubascos ligeros', 81: 'Chubascos moderados', 82: 'Chubascos fuertes',
  95: 'Tormenta', 96: 'Tormenta con granizo', 99: 'Tormenta fuerte',
}

export async function GET() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${MONCLOVA_COORDS.lat}&longitude=${MONCLOVA_COORDS.lon}&current=temperature_2m,weathercode&timezone=America%2FMexico_City`
    const res = await fetch(url, { next: { revalidate: 1800 } })
    const data = await res.json()

    const temp = Math.round(data.current.temperature_2m)
    const code = data.current.weathercode
    const desc = WMO_CODES[code] ?? 'Sin datos'

    return NextResponse.json({ temperature: temp, weatherCode: code, description: desc })
  } catch {
    return NextResponse.json({ temperature: null, weatherCode: 0, description: 'Sin conexión' })
  }
}
