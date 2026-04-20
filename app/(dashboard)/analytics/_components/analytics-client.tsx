'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Package, DollarSign, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface VentaDia { fecha: string; total: number; label: string }
interface Producto { nombre: string; cantidad: number; monto: number }
interface InventarioSemana { semana: string; total: number }

interface AnalyticsData {
  ventasDiarias: VentaDia[]
  topProductos: Producto[]
  inventarioSemanal: InventarioSemana[]
  resumen: {
    totalVentasMes: number
    totalInventarioMes: number
    diasConVenta: number
    promedioVenta: number
    productoEstrella: string
  }
}

const COLORS = ['#DC2626', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6']

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number}[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-gray-900">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const { resumen, ventasDiarias, topProductos, inventarioSemanal } = data

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventas este mes', value: formatCurrency(resumen.totalVentasMes), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Gasto inventario', value: formatCurrency(resumen.totalInventarioMes), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
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

      {/* Ventas diarias - bar chart */}
      {ventasDiarias.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ventas últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ventasDiarias} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#DC2626" radius={[4, 4, 0, 0]} />
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
              <CardTitle className="text-base">Top productos (cantidad vendida)</CardTitle>
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

        {/* Gasto inventario por semana - line */}
        {inventarioSemanal.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Gasto en inventario (últimas semanas)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={inventarioSemanal} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top productos table */}
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
    </div>
  )
}
