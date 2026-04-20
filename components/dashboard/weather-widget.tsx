'use client'

import { useEffect, useState } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react'

interface WeatherData {
  temperature: number | null
  weatherCode: number
  description: string
}

function WeatherIcon({ code, size = 16 }: { code: number; size?: number }) {
  if (code === 0 || code === 1) return <Sun size={size} className="text-yellow-500" />
  if (code <= 3) return <Cloud size={size} className="text-gray-400" />
  if (code <= 67) return <CloudRain size={size} className="text-blue-400" />
  if (code <= 77) return <CloudSnow size={size} className="text-blue-200" />
  if (code >= 95) return <CloudLightning size={size} className="text-yellow-400" />
  return <Wind size={size} className="text-gray-400" />
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    fetch('/api/clima')
      .then((r) => r.json())
      .then(setWeather)
      .catch(() => {})
  }, [])

  if (!weather) {
    return (
      <div className="inline-flex items-center gap-2 bg-white rounded-xl border px-4 py-2 shadow-sm text-sm text-gray-400 w-fit animate-pulse">
        <Cloud className="h-4 w-4" />
        <span>Cargando clima...</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 bg-white rounded-xl border px-4 py-2 shadow-sm text-sm text-gray-600 w-fit">
      <WeatherIcon code={weather.weatherCode} size={16} />
      <span className="hidden sm:inline">{weather.description}</span>
      <span className="font-bold text-gray-900">
        {weather.temperature !== null ? `${weather.temperature}°C` : '—'}
      </span>
      <span className="text-xs text-gray-400 hidden sm:inline">Monclova</span>
    </div>
  )
}
