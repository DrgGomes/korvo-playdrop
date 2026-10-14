'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { BRAND } from '@/lib/brand'
import {
  LayoutDashboard, Shirt, ShoppingCart, TrendingUp, Wallet,
  Package, BarChart3, RotateCcw, User, LogOut,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/dashboard/catalogo', label: 'Catálogo', icon: Shirt },
  { href: '/dashboard/carrinho', label: 'Carrinho', icon: ShoppingCart },
  { href: '/dashboard/vendas', label: 'Vendas', icon: TrendingUp },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/dashboard/produtos', label: 'Produtos', icon: Package },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/dashboard/devolucoes', label: 'Devoluções', icon: RotateCcw },
  { href: '/dashboard/conta', label: 'Minha conta', icon: User },
]

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    // Banner da sidebar (desktop)
    supabase
      .from('banners')
      .select('*')
      .eq('slot', 'sidebar')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data: b }) => setBanner(b?.[0] ?? null))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Revendedor'
  const initial = name?.[0]?.toUpperCase() ?? 'P'

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-white transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
                {/* Marca — SÓ a logo, maior e bem visível */}
        <div className="flex h-24 items-center justify-center border-b border-white/10 px-4">
          {BRAND.logoLightUrl || BRAND.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={BRAND.logoLightUrl || BRAND.logoUrl}
              alt="PlayDrop"
              className="max-h-16 w-auto object-contain"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-extrabold text-white">
              P
            </div>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Menu</p>
          {NAV.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
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

        {/* Banner da sidebar — só desktop */}
        {banner && (
          <div className="hidden px-4 pb-2 lg:block">
            {banner.link_url ? (
              <Link href={banner.link_url} className="block overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.image_url} alt={banner.title || 'Banner'} className="h-[144px] w-[218px] object-cover" />
              </Link>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.image_url} alt={banner.title || 'Banner'} className="h-[144px] w-[218px] object-cover" />
              </div>
            )}
          </div>
        )}

        {/* Rodapé com usuário */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-sm font-bold text-indigo-300">
              {initial}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      </aside>
    </>
  )
}
