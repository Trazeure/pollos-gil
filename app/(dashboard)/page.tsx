import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGreeting, formatDate } from '@/lib/utils'
import {
  Package,
  ShoppingBag,
  TrendingUp,
  FileText,
  ClipboardList,
  Users,
  Calendar,
  BarChart3,
  Lightbulb,
  ArrowRight,
  CloudSun,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

const MODULES = [
  {
    href: '/inventario',
    label: 'Inventario',
    icon: Package,
    desc: 'Recibimiento diario de pollo',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    href: '/productos',
    label: 'Productos',
    icon: ShoppingBag,
    desc: 'Catálogo y precios',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    href: '/ventas',
    label: 'Ventas',
    icon: TrendingUp,
    desc: 'Registro de ventas del día',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    href: '/facturas',
    label: 'Facturas',
    icon: FileText,
    desc: 'Generar y enviar facturas',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    href: '/pedidos',
    label: 'Pedidos',
    icon: ClipboardList,
    desc: 'Gestión de pedidos',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  {
    href: '/trabajadores',
    label: 'Trabajadores',
    icon: Users,
    desc: 'Asistencias y personal',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    href: '/calendario',
    label: 'Calendario',
    icon: Calendar,
    desc: 'Eventos y recordatorios',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    desc: 'Reportes y gráficas',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    href: '/sugerencias',
    label: 'Sugerencias IA',
    icon: Lightbulb,
    desc: 'Recomendaciones de compra',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let nombre = 'Usuario'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', user.id)
      .single()
    if (profile) nombre = profile.nombre
  } catch {
    // ignore
  }

  const greeting = getGreeting(nombre)
  const today = formatDate(new Date())

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}</h1>
          <p className="text-sm text-gray-500 capitalize mt-0.5">{today}</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-white rounded-xl border px-4 py-2 shadow-sm text-sm text-gray-600 w-fit">
          <CloudSun className="h-4 w-4 text-yellow-500" />
          <span>Monclova, Coah.</span>
          <span className="font-semibold text-gray-800 ml-1">—°C</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Ventas Hoy
              </p>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-400 mt-1">Sin registros</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Pedidos
              </p>
              <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-400 mt-1">Pendientes</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Asistencias
              </p>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-400 mt-1">Hoy presentes</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Inventario
              </p>
              <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-400 mt-1">Registro de hoy</p>
          </CardContent>
        </Card>
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Módulos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map(({ href, label, icon: Icon, desc, color, bg }) => (
            <Link key={href} href={href}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}
                    >
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{label}</p>
                      <p className="text-xs text-gray-400 truncate">{desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
