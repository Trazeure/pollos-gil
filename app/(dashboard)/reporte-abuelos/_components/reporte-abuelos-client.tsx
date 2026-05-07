'use client'

import { FileDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface Props {
  resumen: {
    hoyVentas: number
    hoyGastos: number
    hoyGanancia: number
    ayerGanancia: number
    mesVentas: number
    mesGastos: number
    mesGanancia: number
    anioVentas: number
    anioGastos: number
    anioGanancia: number
  }
  tendencia: { mes: string; ventas: number; gastos: number }[]
}

function GananciaCard({
  titulo,
  subtitulo,
  ventas,
  gastos,
  ganancia,
  tipo,
}: {
  titulo: string
  subtitulo: string
  ventas: number
  gastos: number
  ganancia: number
  tipo: 'diario' | 'mensual' | 'anual'
}) {
  const positivo = ganancia >= 0

  return (
    <div className={`rounded-2xl border-2 p-6 flex flex-col gap-4 ${positivo ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{subtitulo}</p>
        <h3 className="text-xl font-black text-gray-900 mt-0.5">{titulo}</h3>
      </div>

      <div className={`text-center rounded-xl py-4 border-2 ${positivo ? 'border-green-300 bg-green-100' : 'border-red-300 bg-red-100'}`}>
        <p className="text-sm font-semibold text-gray-600 mb-1">Lo que quedó</p>
        <p className={`text-4xl font-black ${positivo ? 'text-green-700' : 'text-red-700'}`}>
          {formatCurrency(ganancia)}
        </p>
        <div className={`flex items-center justify-center gap-1.5 mt-2 ${positivo ? 'text-green-600' : 'text-red-600'}`}>
          {positivo
            ? <TrendingUp className="h-4 w-4" />
            : ganancia < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
          <span className="text-sm font-semibold">{positivo ? 'Todo va bien' : 'Hay que revisar'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border-2 border-green-200 p-3 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">Lo que entró</p>
          <p className="text-lg font-black text-green-700">{formatCurrency(ventas)}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-red-200 p-3 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">Lo que salió</p>
          <p className="text-lg font-black text-red-600">{formatCurrency(gastos)}</p>
        </div>
      </div>

      <a
        href={`/api/reporte-abuelos/pdf?tipo=${tipo}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
          positivo
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        <FileDown className="h-4 w-4" />
        Descargar reporte en PDF
      </a>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-3 shadow-lg">
      <p className="text-sm font-bold text-gray-800 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm" style={{ color: p.color }}>
          <span className="font-medium">{p.name}:</span> {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export function ReporteAbuelosClient({ resumen, tendencia }: Props) {
  const hoyDiff = resumen.hoyGanancia - resumen.ayerGanancia
  const mejoro = hoyDiff >= 0

  return (
    <div className="space-y-8">
      {/* Comparison note for today */}
      {resumen.ayerGanancia !== 0 && (
        <div className={`flex items-center gap-3 rounded-xl border-2 p-4 ${mejoro ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
          <span className={`text-3xl font-black ${mejoro ? 'text-green-600' : 'text-amber-600'}`}>
            {mejoro ? '↑' : '↓'}
          </span>
          <div>
            <p className={`font-bold ${mejoro ? 'text-green-800' : 'text-amber-800'}`}>
              {mejoro
                ? `Hoy fue ${formatCurrency(Math.abs(hoyDiff))} mejor que ayer`
                : `Hoy fue ${formatCurrency(Math.abs(hoyDiff))} menos que ayer`}
            </p>
            <p className="text-sm text-gray-500">Ayer quedaron: {formatCurrency(resumen.ayerGanancia)}</p>
          </div>
        </div>
      )}

      {/* Three main cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GananciaCard
          titulo="Hoy"
          subtitulo="Reporte del día"
          ventas={resumen.hoyVentas}
          gastos={resumen.hoyGastos}
          ganancia={resumen.hoyGanancia}
          tipo="diario"
        />
        <GananciaCard
          titulo="Este Mes"
          subtitulo="Reporte mensual"
          ventas={resumen.mesVentas}
          gastos={resumen.mesGastos}
          ganancia={resumen.mesGanancia}
          tipo="mensual"
        />
        <GananciaCard
          titulo="Este Año"
          subtitulo="Reporte anual"
          ventas={resumen.anioVentas}
          gastos={resumen.anioGastos}
          ganancia={resumen.anioGanancia}
          tipo="anual"
        />
      </div>

      {/* Bar chart */}
      {tendencia.length > 0 && (
        <div className="bg-white rounded-2xl border-0 shadow-sm p-6">
          <h2 className="text-lg font-black text-gray-900 mb-1">Cómo han ido los últimos meses</h2>
          <p className="text-sm text-gray-500 mb-6">Verde = lo que entró · Rojo = lo que salió</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tendencia} barGap={4} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }} />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => value === 'ventas' ? 'Lo que entró' : 'Lo que salió'}
                wrapperStyle={{ fontSize: 13, fontWeight: 600 }}
              />
              <Bar dataKey="ventas" name="ventas" fill="#2D7A2D" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="gastos" fill="#C43E3E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
