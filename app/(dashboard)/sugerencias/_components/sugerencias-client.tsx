'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Sparkles, Loader2, TrendingUp, Package, Star, AlertTriangle,
  RefreshCw, Brain,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'

interface SugerenciasData {
  recomendaciones: string[]
  cantidad_sugerida_kg: { menudencia: number; seara: number; pollo: number }
  productos_estrella: string[]
  productos_baja_rotacion: string[]
  razonamiento: string
  generado_en: string
}

export function SugerenciasClient() {
  const [data, setData] = useState<SugerenciasData | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ia/sugerencias')
      if (!res.ok) throw new Error()
      const json: SugerenciasData = await res.json()
      setData(json)
      toast.success('Análisis generado')
    } catch {
      toast.error('Error al generar. Verifica tu API key de OpenAI.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* CTA */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-12 w-12 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Análisis de las últimas 4 semanas</p>
            <p className="text-sm text-gray-500 mt-0.5">
              GPT-4o-mini analiza tus ventas e inventario para darte recomendaciones concretas
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shrink-0"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Analizando...</>
            ) : data ? (
              <><RefreshCw className="h-4 w-4" />Regenerar</>
            ) : (
              <><Sparkles className="h-4 w-4" />Generar análisis</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && data && (
        <div className="space-y-4">
          {/* Razonamiento */}
          <Card className="border-0 shadow-sm bg-gray-50">
            <CardContent className="p-4 flex gap-3">
              <Sparkles className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 leading-relaxed">{data.razonamiento}</p>
            </CardContent>
          </Card>

          {/* Cantidad sugerida */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Compra sugerida para esta semana
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Menudencia', key: 'menudencia', color: 'orange' },
                  { label: 'Seara', key: 'seara', color: 'blue' },
                  { label: 'Pollo', key: 'pollo', color: 'yellow' },
                ].map(({ label, key, color }) => (
                  <div
                    key={key}
                    className={`bg-${color}-50 rounded-xl p-3 text-center border border-${color}-100`}
                  >
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-2xl font-black text-gray-900">
                      {data.cantidad_sugerida_kg[key as keyof typeof data.cantidad_sugerida_kg]}
                    </p>
                    <p className="text-xs text-gray-400">kg</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recomendaciones */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Recomendaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {data.recomendaciones.map((rec, i) => (
                <div key={i} className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <span className="h-5 w-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Productos estrella + baja rotación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Productos estrella
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5">
                {(data.productos_estrella ?? []).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />
                    {p}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Baja rotación
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5">
                {(data.productos_baja_rotacion ?? []).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <AlertTriangle className="h-3 w-3 text-orange-400 shrink-0" />
                    {p}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-gray-300 text-center">
            Generado el{' '}
            {new Date(data.generado_en).toLocaleString('es-MX', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !data && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
              <Brain className="h-8 w-8 text-purple-300" />
            </div>
            <p className="text-gray-500 font-medium">Sin análisis generado</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">
              Toca "Generar análisis" para que la IA analice tus datos y te dé recomendaciones
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
