'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3, Settings,
  LogOut, Shield, Menu, X,
} from 'lucide-react'

const MENU = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/dashboard/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/dashboard/admin/produtos', label: 'Catálogo', icon: Package },
  { href: '/dashboard/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export default function AdminLayout({ children }) {
  const [isAdmin, setIsAdmin] = useState(null)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    check()
  }, [])

  async function check() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    setIsAdmin(true)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Verificando acesso...</p>
      </div>
    )
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-black text-white">
          P
        </div>
        <div className="leading-tight">
          <p className="text-sm font-extrabold text-white">PlayDrop</p>
          <p className="text-[11px] text-slate-400">by Korvo Ecossistema</p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 px-5">
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
          <Shield size={12} /> Área Admin
        </span>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        {MENU.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} /> Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-slate-900 lg:block">
        {SidebarContent}
      </aside>

      {/* Sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Conteúdo */}
      <div className="lg:pl-64">
        {/* Topbar admin */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-8">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-indigo-600" />
            <span className="text-sm font-bold text-slate-800">Painel Administrativo</span>
          </div>
          <Link
            href="/dashboard"
            className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Ver painel do cliente
          </Link>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
