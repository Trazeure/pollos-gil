import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, Download, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { NuevaFacturaDialog } from './_components/nueva-factura-dialog'
import type { Factura } from '@/lib/types'

export default async function FacturasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: facturas = [] } = await supabase
    .from('facturas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const totalMes = (facturas ?? []).reduce((s, f) => s + (f.total ?? 0), 0)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {facturas?.length ?? 0} notas · {formatCurrency(totalMes)} total
          </p>
        </div>
        <NuevaFacturaDialog />
      </div>

      {/* Empty state */}
      {(!facturas || facturas.length === 0) ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-red-300" />
            </div>
            <p className="text-gray-500 font-medium">No hay facturas aún</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">
              Crea tu primera nota de venta con el botón de arriba
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
            Historial
          </h2>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="divide-y">
              {(facturas as Factura[]).map((f) => {
                const folio = String(f.folio).padStart(4, '0')
                const fecha = format(parseISO(f.created_at), "d MMM yyyy", { locale: es })
                const waMsg = `*Nota de venta #${folio} - Pollos Gil*\nCliente: ${f.cliente_nombre}\nTotal: ${formatCurrency(f.total)}\n\n_Gracias por su compra_ 🐔`
                return (
                  <div key={f.id} className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm">#{folio}</p>
                          <span className="text-gray-300">·</span>
                          <p className="text-sm text-gray-700 truncate">{f.cliente_nombre}</p>
                          {f.cliente_rfc && (
                            <span className="text-xs text-gray-400 hidden sm:inline">{f.cliente_rfc}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{fecha}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <p className="font-bold text-gray-900 text-sm mr-1">{formatCurrency(f.total)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 gap-1 text-xs"
                        asChild
                      >
                        <a href={`/api/facturas/${f.id}/pdf`} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3 w-3" />
                          PDF
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 gap-1 text-xs text-green-600 border-green-200 hover:bg-green-50"
                        asChild
                      >
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-3 w-3" />
                          WA
                        </a>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
