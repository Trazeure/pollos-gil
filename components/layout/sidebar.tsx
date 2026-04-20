'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  TrendingUp,
  FileText,
  ClipboardList,
  Users,
  CalendarCheck,
  Calendar,
  BarChart3,
  Lightbulb,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/productos', label: 'Productos', icon: ShoppingBag },
  { href: '/ventas', label: 'Ventas', icon: TrendingUp },
  { href: '/facturas', label: 'Facturas', icon: FileText },
  { href: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/trabajadores', label: 'Trabajadores', icon: Users },
  { href: '/asistencias', label: 'Asistencias', icon: CalendarCheck },
  { href: '/calendario', label: 'Calendario', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/sugerencias', label: 'Sugerencias IA', icon: Lightbulb },
]

interface SidebarProps {
  user: { nombre: string; rol: string }
}

function NavContent({
  collapsed,
  onClose,
  user,
  onLogout,
  onCollapse,
  showCollapseButton,
}: {
  collapsed: boolean
  onClose?: () => void
  user: { nombre: string; rol: string }
  onLogout: () => void
  onCollapse?: () => void
  showCollapseButton?: boolean
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          'flex items-center border-b border-gray-800 p-4 min-h-[64px]',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-1">
            <span
              className="font-black text-lg tracking-widest leading-none"
              style={{ color: '#FBBF24' }}
            >
              POLLOS
            </span>
            <span
              className="font-black text-lg tracking-widest leading-none ml-1"
              style={{ color: '#DC2626' }}
            >
              GIL
            </span>
          </div>
        )}
        {collapsed && (
          <span className="font-black text-xl" style={{ color: '#DC2626' }}>
            P
          </span>
        )}
        {showCollapseButton && (
          <button
            onClick={onCollapse}
            className="h-7 w-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-800 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-gray-800 p-3 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
            <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.nombre}</p>
              <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={cn(
            'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-800 hover:text-white transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={16} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ user }: SidebarProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 h-9 w-9 flex items-center justify-center rounded-lg bg-gray-900 text-white shadow-lg border border-gray-700"
      >
        {mobileOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 bottom-0 z-40 w-64 bg-gray-900 shadow-2xl transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent
          collapsed={false}
          onClose={() => setMobileOpen(false)}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-gray-900 transition-all duration-300 shrink-0',
          collapsed ? 'w-[60px]' : 'w-60'
        )}
      >
        <NavContent
          collapsed={collapsed}
          user={user}
          onLogout={handleLogout}
          onCollapse={() => setCollapsed(!collapsed)}
          showCollapseButton
        />
      </aside>
    </>
  )
}
