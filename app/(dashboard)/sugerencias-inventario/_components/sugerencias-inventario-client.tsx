'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, ShoppingCart, AlertTriangle, ChevronDown, ChevronUp, TrendingUp, Thermometer, CalendarDays, Banknote, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CompraItem {
  kilos: number
  confianza: 'alta' | 'media' | 'baja'
  razon: string
}

interface SugerenciasInventarioResult {
  compras_sugeridas: { menudencia: CompraItem; seara: CompraItem; pollo: CompraItem }
  contexto_detectado: {
    dia_semana: string
    estado_quincena: 'quincena' | 'quincena_cercana' | 'fondo_quincena' | 'normal'
    clima: string
    festivo_proximo: string | null
  }
  alerta: string | null
  patrones_aprendidos: string[]
  razonamiento: string
  stock_estimado: { menudencia: number; seara: number; pollo: number }
  generado_en: string
}

const CONFIANZA_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  alta:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Confianza alta' },
  media: { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Confianza media' },
  baja:  { bg: 'bg-red-100',    text: 'text-red-600',    label: 'Confianza baja' },
}

const QUINCENA_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  quincena:         { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-300', label: 'Día de quincena' },
  quincena_cercana: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-300',  label: 'Próximo a quincena' },
  fondo_quincena:   { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300',label: 'Fondo de quincena' },
  normal:           { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200',  label: 'Período normal' },
}

const TIPO_INFO = {
  menudencia: { color: 'border-orange-400 bg-orange-50', accent: 'text-orange-700', dot: 'bg-orange-400', label: 'Menudencia' },
  seara:      { color: 'border-blue-400 bg-blue-50',     accent: 'text-blue-700',   dot: 'bg-blue-400',   label: 'Seara (Pechuga)' },
  pollo:      { color: 'border-yellow-400 bg-yellow-50', accent: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Pollo' },
}

function CompraCard({ tipo, item, stockActual }: {
  tipo: keyof typeof TIPO_INFO
  item: CompraItem
  stockActual: number
}) {
  const info = TIPO_INFO[tipo]
  const conf = CONFIANZA_STYLES[item.confianza]
  const totalTras = stockActual + item.kilos

  return (
    <Card className={`border-2 ${info.color} shadow-sm`}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${info.dot}`} />
            <p className="text-sm font-bold text-gray-700">{info.label}</p>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${conf.bg} ${conf.text}`}>
            {conf.label}
          </span>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 mb-0.5">Comprar mañana</p>
          <p className={`text-5xl font-black ${info.accent}`}>{item.kilos}</p>
          <p className="text-sm text-gray-500 font-medium">kilogramos</p>
        </div>

        <div className="bg-white rounded-lg p-3 space-y-1.5 border border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Stock actual estimado</span>
            <span className="font-semibold text-gray-700">~{stockActual} kg</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>+ Compra sugerida</span>
            <span className="font-semibold text-gray-700">+ {item.kilos} kg</span>
          </div>
          <div className="border-t border-gray-100 pt-1 flex justify-between text-xs">
            <span className="font-semibold text-gray-600">Total disponible</span>
            <span className={`font-black ${info.accent}`}>~{totalTras} kg</span>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed italic">"{item.razon}"</p>
      </CardContent>
    </Card>
  )
}

function ContextChip({ icon: Icon, label, sublabel, style }: {
  icon: React.ElementType
  label: string
  sublabel?: string
  style?: string
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${style ?? 'bg-gray-50 border-gray-200 text-gray-700'}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <div>
        <p className="text-xs font-semibold leading-none">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}

export function SugerenciasInventarioClient() {
  const [data, setData] = useState<SugerenciasInventarioResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRazonamiento, setShowRazonamiento] = useState(false)

  async function generar() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ia/sugerencias-inventario')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const qStyle = data ? QUINCENA_STYLES[data.contexto_detectado.estado_quincena] : null

  return (
    <div className="space-y-6">
      {/* Generate button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {data
            ? `Generado: ${new Date(data.generado_en).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`
            : 'El análisis tarda ~15-20 segundos'}
        </p>
        <Button
          onClick={generar}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white gap-2"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Analizando...</>
          ) : data ? (
            <><RefreshCw className="h-4 w-4" />Regenerar</>
          ) : (
            <><ShoppingCart className="h-4 w-4" />Generar análisis</>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 p-8 bg-gray-50 rounded-2xl border border-gray-100">
            <Loader2 className="h-6 w-6 animate-spin text-red-500" />
            <div>
              <p className="font-semibold text-gray-800">Analizando patrones de venta...</p>
              <p className="text-sm text-gray-500">Clima · Quincena · Historial · Festivos · Stock</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Context row */}
          <div className="flex flex-wrap gap-2">
            <ContextChip
              icon={CalendarDays}
              label={data.contexto_detectado.dia_semana}
              sublabel="mañana"
              style="bg-gray-50 border-gray-200 text-gray-700"
            />
            <ContextChip
              icon={Banknote}
              label={qStyle!.label}
              style={`${qStyle!.bg} ${qStyle!.border} ${qStyle!.text}`}
            />
            <ContextChip
              icon={Thermometer}
              label={data.contexto_detectado.clima}
              style="bg-sky-50 border-sky-200 text-sky-700"
            />
            {data.contexto_detectado.festivo_proximo && (
              <ContextChip
                icon={CalendarDays}
                label={data.contexto_detectado.festivo_proximo}
                style="bg-purple-50 border-purple-200 text-purple-700"
              />
            )}
          </div>

          {/* Alert */}
          {data.alerta && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-amber-800">{data.alerta}</p>
            </div>
          )}

          {/* Three purchase cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {(['menudencia', 'seara', 'pollo'] as const).map(tipo => (
              <CompraCard
                key={tipo}
                tipo={tipo}
                item={data.compras_sugeridas[tipo]}
                stockActual={data.stock_estimado[tipo]}
              />
            ))}
          </div>

          {/* Patterns */}
          {data.patrones_aprendidos.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-700">Patrones detectados en tus datos</h3>
                </div>
                <ul className="space-y-2">
                  {data.patrones_aprendidos.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Stock reference */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700">Stock estimado actual (antes de comprar)</h3>
                <span className="text-xs text-gray-400">— basado en última compra y consumo histórico</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['menudencia', 'seara', 'pollo'] as const).map(tipo => (
                  <div key={tipo} className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 capitalize">{TIPO_INFO[tipo].label}</p>
                    <p className={`text-2xl font-black mt-1 ${TIPO_INFO[tipo].accent}`}>
                      ~{data.stock_estimado[tipo]}
                    </p>
                    <p className="text-xs text-gray-400">kg</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reasoning collapsible */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <button
                onClick={() => setShowRazonamiento(!showRazonamiento)}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span>Ver razonamiento completo del modelo</span>
                {showRazonamiento ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showRazonamiento && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {data.razonamiento}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
