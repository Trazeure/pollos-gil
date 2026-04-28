'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Package, DollarSign, Calendar, TrendingDown, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

interface VentaDia { fecha: string; total: number; label: string }
interface Producto { nombre: string; cantidad: number; monto: number }
interface InventarioSemana { semana: string; total: number }
interface VentasVsGastos { semana: string; ventas: number; gastos: number; utilidad: number }
interface TendenciaMes { mes: string; ventas: number; gastos: number; utilidad: number }

interface AnalyticsData {
  ventasDiarias: VentaDia[]
  topProductos: Producto[]
  inventarioSemanal: InventarioSemana[]
  ventasVsGastosSemanal: VentasVsGastos[]
  tendenciaMensual: TendenciaMes[]
  resumen: {
    totalVentasMes: number
    totalInventarioMes: number
    utilidadMes: number
    margenMes: number
    diasConVenta: number
    promedioVenta: number
    productoEstrella: string
  }
}

const COLORS = ['#DC2626', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6']

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 min-w-[140px]">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-gray-600 capitalize">{p.name}</span>
          </span>
          <span className="font-bold text-gray-900">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const PERIODOS = [
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mes' },
  { key: 'anual', label: 'Este año' },
]

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const { resumen, ventasDiarias, topProductos, inventarioSemanal, ventasVsGastosSemanal, tendenciaMensual } = data
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)

  async function descargarPDF(periodo: string) {
    setPdfLoading(periodo)
    const a = document.createElement('a')
    a.href = `/api/reportes/pdf?periodo=${periodo}`
    a.download = `reporte-pollos-gil-${periodo}.pdf`
    a.click()
    setTimeout(() => setPdfLoading(null), 2000)
  }

  const margenColor = resumen.margenMes >= 30 ? 'text-green-700' : resumen.margenMes >= 15 ? 'text-yellow-700' : 'text-red-700'
  const margenBg = resumen.margenMes >= 30 ? 'bg-green-50' : resumen.margenMes >= 15 ? 'bg-yellow-50' : 'bg-red-50'

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Ventas este mes', value: formatCurrency(resumen.totalVentasMes), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Gasto inventario', value: formatCurrency(resumen.totalInventarioMes), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Utilidad bruta', value: formatCurrency(resumen.utilidadMes), icon: resumen.utilidadMes >= 0 ? TrendingUp : TrendingDown, color: resumen.utilidadMes >= 0 ? 'text-emerald-600' : 'text-red-600', bg: resumen.utilidadMes >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
          { label: 'Margen bruto', value: `${resumen.margenMes.toFixed(1)}%`, icon: DollarSign, color: margenColor, bg: margenBg },
          { label: 'Promedio diario', value: formatCurrency(resumen.promedioVenta), icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Días activos', value: String(resumen.diasConVenta), icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`h-9 w-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Producto estrella */}
      {resumen.productoEstrella && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-lg">⭐</span>
          </div>
          <div>
            <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Producto estrella del mes</p>
            <p className="text-base font-bold text-gray-900">{resumen.productoEstrella}</p>
          </div>
        </div>
      )}

      {/* Ventas vs Gastos semanal */}
      {ventasVsGastosSemanal.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ventas vs Gastos por semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={ventasVsGastosSemanal} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="ventas" fill="#22C55E" radius={[3, 3, 0, 0]} name="Ventas" maxBarSize={32} />
                <Bar dataKey="gastos" fill="#EF4444" radius={[3, 3, 0, 0]} name="Gastos" maxBarSize={32} />
                <Line type="monotone" dataKey="utilidad" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: '#F59E0B', r: 4 }} name="Utilidad" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tendencia mensual 6 meses */}
      {tendenciaMensual.length > 1 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tendencia últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={tendenciaMensual} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="ventas" fill="#22C55E" radius={[3, 3, 0, 0]} name="Ventas" maxBarSize={28} />
                <Bar dataKey="gastos" fill="#3B82F6" radius={[3, 3, 0, 0]} name="Gastos" maxBarSize={28} />
                <Line type="monotone" dataKey="utilidad" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: '#F59E0B', r: 4 }} name="Utilidad" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Ventas diarias */}
      {ventasDiarias.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ventas diarias — últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ventasDiarias} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#DC2626" radius={[4, 4, 0, 0]} name="Ventas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top productos - pie */}
        {topProductos.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top productos (cantidad)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={topProductos.slice(0, 8)}
                    dataKey="cantidad"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ nombre, percent }) => `${nombre.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {topProductos.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gasto inventario semanal */}
        {inventarioSemanal.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Gasto en inventario (semanas)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={inventarioSemanal} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} name="Gasto" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ranking productos */}
      {topProductos.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ranking de productos</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {topProductos.slice(0, 8).map((p, i) => {
                const maxCant = topProductos[0].cantidad
                const pct = Math.round((p.cantidad / maxCant) * 100)
                return (
                  <div key={p.nombre} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 truncate max-w-[180px]">{p.nombre}</span>
                        <span className="text-gray-500 shrink-0">{p.cantidad} uds · {formatCurrency(p.monto)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Reports */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            Reportes PDF — Ventas vs Gastos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-500 mb-4">Descarga un reporte detallado con ventas, gastos y utilidad del período seleccionado.</p>
          <div className="flex flex-wrap gap-3">
            {PERIODOS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => descargarPDF(key)}
                disabled={pdfLoading === key}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 text-sm font-semibold text-gray-700 hover:text-red-700 transition-all disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                {pdfLoading === key ? 'Generando...' : label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
