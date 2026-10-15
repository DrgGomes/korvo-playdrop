'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  LayoutDashboard, BarChart3, Settings,
  LogOut, Shield, Menu, X, ChevronLeft, ChevronRight, Megaphone,
  PackageSearch, ShoppingCart, Database
} from 'lucide-react'

// Menu exclusivo do admin — sem nada da visão do cliente
const MENU = [
  { href: '/dashboard/admin', label: 'Admin', icon: LayoutDashboard },
  { href: '/dashboard/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/dashboard/admin/status', label: 'Atualizar pedido', icon: PackageSearch },
  { href: '/dashboard/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/dashboard/admin/avisos', label: 'Avisos', icon: Megaphone },
  { href: '/dashboard/admin/backup', label: 'Backup', icon: Database },
  { href: '/dashboard/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export default function AdminLayout({ children }) {
  const [isAdmin, setIsAdmin] = useState(null)
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('playdrop-admin-collapsed')
    if (saved === '1') setCollapsed(true)
  }, [])

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

  function toggleCollapse() {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('playdrop-admin-collapsed', next ? '1' : '0')
      return next
    })
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

  function renderSidebar(forceExpanded = false) {
    const isCollapsed = !forceExpanded && collapsed
    return (
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={`flex items-center gap-2 px-5 py-5 ${isCollapsed ? 'justify-center px-0' : ''}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-black text-white">
            P
          </div>
          {!isCollapsed && (
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-white">PlayDrop</p>
              <p className="text-[11px] text-slate-400">by Korvo Ecossistema</p>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="mt-2 flex items-center gap-2 px-5">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
              <Shield size={12} /> Área Admin
            </span>
          </div>
        )}

        <nav className={`mt-4 flex-1 space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {MENU.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl text-sm font-medium transition ${
                  isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'
                } ${
                  active
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!isCollapsed && item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className={`flex w-full items-center gap-3 rounded-xl text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white ${
              isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && 'Recolher'}
          </button>
          <button
            onClick={logout}
            title={isCollapsed ? 'Sair' : undefined}
            className={`mt-1 flex w-full items-center gap-3 rounded-xl text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white ${
              isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && 'Sair'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden bg-slate-900 transition-all duration-200 lg:block ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebar()}
      </aside>

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
            {renderSidebar(true)}
          </aside>
        </div>
      )}

      <div className={collapsed ? 'lg:pl-20' : 'lg:pl-64'}>
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
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
