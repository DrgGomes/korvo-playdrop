'use client'

import { useEffect, useState } from 'react'
import { Menu, Bell, Search } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function Topbar({ onMenu }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('revendedor')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()
        setRole(profile?.role || 'revendedor')
      }
    })
  }, [])

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Revendedor'
  const initial = name?.[0]?.toUpperCase() ?? 'P'
  const roleLabel = role === 'admin' ? 'Admin' : 'Revendedor'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-8">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      <div className="hidden max-w-md flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 md:flex">
        <Search size={16} className="text-slate-400" />
        <input
          placeholder="Buscar pedido, produto ou cliente..."
          className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500" />
        </button>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            {initial}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-slate-800">{name}</p>
            <p className="text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
