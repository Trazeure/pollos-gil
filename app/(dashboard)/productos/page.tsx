import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ProductRow } from './_components/product-row'
import { AgregarProductoDialog } from './_components/producto-dialog'
import type { Producto } from '@/lib/types'
import { CATEGORIAS_PRODUCTO } from '@/lib/constants'

export default async function ProductosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: productos = [] } = await supabase
    .from('productos')
    .select('*')
    .order('categoria')
    .order('nombre')

  const byCategory = CATEGORIAS_PRODUCTO.reduce<Record<string, Producto[]>>((acc, cat) => {
    acc[cat] = (productos ?? []).filter((p) => p.categoria === cat)
    return acc
  }, {})

  const total = productos?.length ?? 0
  const activos = productos?.filter((p) => p.activo).length ?? 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activos} activos · {total} total
          </p>
        </div>
        <AgregarProductoDialog />
      </div>

      {total === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <ShoppingBag className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay productos aún</p>
            <p className="text-sm text-gray-400 mt-1">Agrega tu primer producto con el botón de arriba</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {CATEGORIAS_PRODUCTO.map((categoria) => {
            const items = byCategory[categoria]
            if (!items || items.length === 0) return null
            return (
              <div key={categoria}>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                  {categoria}
                </h2>
                <Card className="border-0 shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="w-[45%]">Producto</TableHead>
                        <TableHead className="w-[15%]">Unidad</TableHead>
                        <TableHead className="w-[25%]">Precio</TableHead>
                        <TableHead className="w-[15%]">Activo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((producto) => (
                        <ProductRow key={producto.id} producto={producto} />
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
