import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { NuevoPedidoDialog } from './_components/nuevo-pedido-dialog'
import { PedidoCard } from './_components/pedido-card'
import type { Pedido, EstadoPedido } from '@/lib/types'
import { cn } from '@/lib/utils'

const TABS: { value: EstadoPedido | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'a_deber', label: 'A Deber' },
  { value: 'pagado', label: 'Pagados' },
]

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: { estado?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const filtro = (searchParams.estado as EstadoPedido | 'todos') ?? 'todos'

  let query = supabase.from('pedidos').select('*').order('created_at', { ascending: false })
  if (filtro !== 'todos') query = query.eq('estado', filtro)
  const { data: pedidos = [] } = await query.limit(100)

  // Stats
  const { data: todos } = await supabase.from('pedidos').select('estado, total')
  const pendientes = todos?.filter(p => p.estado === 'pendiente') ?? []
  const aDebers = todos?.filter(p => p.estado === 'a_deber') ?? []
  const totalPendiente = pendientes.reduce((s, p) => s + p.total, 0)
  const totalDeber = aDebers.reduce((s, p) => s + p.total, 0)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{todos?.length ?? 0} pedidos en total</p>
        </div>
        <NuevoPedidoDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Pendientes</p>
            <p className="text-xl font-black text-yellow-600">{pendientes.length}</p>
            <p className="text-xs text-gray-400">{formatCurrency(totalPendiente)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">A Deber</p>
            <p className="text-xl font-black text-red-600">{aDebers.length}</p>
            <p className="text-xs text-gray-400">{formatCurrency(totalDeber)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Por cobrar</p>
            <p className="text-xl font-black text-gray-900">{formatCurrency(totalPendiente + totalDeber)}</p>
            <p className="text-xs text-gray-400">pendiente + deber</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <a
            key={tab.value}
            href={tab.value === 'todos' ? '/pedidos' : `/pedidos?estado=${tab.value}`}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              filtro === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* List */}
      {(!pedidos || pedidos.length === 0) ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <ClipboardList className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Sin pedidos en esta categoría</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(pedidos as Pedido[]).map(p => <PedidoCard key={p.id} pedido={p} />)}
        </div>
      )}
    </div>
  )
}
