'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Camera, Loader2, Check, RefreshCw, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { guardarVenta } from '../actions'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

interface ExtractedItem {
  producto: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

interface ExtractedData {
  items: ExtractedItem[]
  total: number
  fecha: string | null
}

export function VentaIATab() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [image, setImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [items, setItems] = useState<ExtractedItem[]>([])
  const [analyzed, setAnalyzed] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Solo se aceptan imágenes'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setImage({ base64: result.split(',')[1], mimeType: file.type, preview: result })
      setAnalyzed(false)
      setItems([])
    }
    reader.readAsDataURL(file)
  }

  async function handleAnalyze() {
    if (!image) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/ia/extraer-corte-z', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: image.base64, mimeType: image.mimeType }),
      })
      const data: ExtractedData = await res.json()
      if (!res.ok) throw new Error((data as unknown as { error?: string }).error ?? 'Error desconocido')
      const validItems = (data.items ?? []).filter((i) => i.cantidad > 0)
      setItems(validItems)
      setAnalyzed(true)
      if (validItems.length === 0) {
        toast.warning('No se encontraron productos. Intenta con mejor iluminación.')
      } else {
        toast.success(`${validItems.length} productos extraídos`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al analizar')
    } finally {
      setAnalyzing(false)
    }
  }

  function updateItem(idx: number, qty: number) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, cantidad: qty, subtotal: qty * it.precio_unitario } : it
      )
    )
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    const valid = items.filter((i) => i.cantidad > 0)
    if (valid.length === 0) { toast.error('No hay productos válidos'); return }
    setSaving(true)
    const fd = new FormData()
    fd.set('fecha', today)
    fd.set('items', JSON.stringify(valid.map((i) => ({
      producto_id: `ia-${i.producto.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`,
      producto_nombre: i.producto,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
      subtotal: i.subtotal,
    }))))
    const result = await guardarVenta(null, fd)
    setSaving(false)
    if (result.error) { toast.error(result.error) } else {
      toast.success('Ventas guardadas')
      setImage(null); setItems([]); setAnalyzed(false)
    }
  }

  const total = items.reduce((s, i) => s + i.subtotal, 0)

  if (!image) {
    return (
      <div className="space-y-3">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-all group"
        >
          <div className="h-16 w-16 rounded-2xl bg-red-50 group-hover:bg-red-100 flex items-center justify-center mb-4 transition-colors">
            <Camera className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-base font-semibold text-gray-700">Sube foto del corte X, Y o Z</p>
          <p className="text-sm text-gray-400 mt-1">Arrastra la imagen aquí o toca para seleccionar</p>
          <p className="text-xs text-gray-300 mt-2">La IA extrae todos los productos automáticamente</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>Funciona con tickets de caja, cortes X, Y y Z. Mejor con buena iluminación.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-3">
          <div className="relative">
            <img src={image.preview} alt="Ticket" className="w-full max-h-56 object-contain rounded-lg bg-gray-50" />
            <button
              onClick={() => { setImage(null); setItems([]); setAnalyzed(false) }}
              className="absolute top-2 right-2 h-7 w-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow text-gray-500 hover:text-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </CardContent>
      </Card>

      {!analyzed ? (
        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold gap-2"
        >
          {analyzing ? (
            <><Loader2 className="h-5 w-5 animate-spin" />Analizando con IA...</>
          ) : (
            <><Sparkles className="h-5 w-5" />Analizar con IA</>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              Productos extraídos ({items.length})
            </p>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={12} className={analyzing ? 'animate-spin' : ''} />
              Re-analizar
            </button>
          </div>

          {items.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-8 text-center">
                <p className="text-gray-500 text-sm">No se extrajeron productos. Intenta con otra imagen.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="divide-y">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.producto}</p>
                        <p className="text-xs text-gray-400">{formatCurrency(item.precio_unitario)}/u</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          value={item.cantidad || ''}
                          onChange={(e) => updateItem(idx, parseFloat(e.target.value) || 0)}
                          className="w-16 h-8 text-sm text-center"
                          min="0"
                          step="0.1"
                        />
                        <span className="text-sm font-semibold text-gray-800 w-20 text-right">
                          {formatCurrency(item.subtotal)}
                        </span>
                        <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-0 bg-gray-900 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Total extraído</span>
                  <span className="text-2xl font-black text-white">{formatCurrency(total)}</span>
                </CardContent>
              </Card>

              <Button
                onClick={handleSave}
                disabled={saving || items.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold gap-2"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                {saving ? 'Guardando...' : 'Guardar ventas del ticket'}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
