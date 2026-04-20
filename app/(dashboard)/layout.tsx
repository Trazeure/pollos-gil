import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let nombre = 'Usuario'
  let rol: 'admin' | 'empleado' = 'admin'

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre, rol')
      .eq('id', user.id)
      .single()

    if (profile) {
      nombre = profile.nombre
      rol = profile.rol as 'admin' | 'empleado'
    }
  } catch {
    // profiles table may not exist yet — use defaults
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={{ nombre, rol }} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
