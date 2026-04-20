import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SugerenciasClient } from './_components/sugerencias-client'

export default async function SugerenciasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sugerencias IA</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Análisis inteligente basado en tus ventas e inventario
        </p>
      </div>
      <SugerenciasClient />
    </div>
  )
}
