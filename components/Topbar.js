'use client'

import { useEffect, useState } from 'react'
import { Menu, Bell, Search, Info, Tag, AlertTriangle, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/utils'

const TYPE_META = {
  info: { icon: Info, chip: 'bg-blue-50 text-blue-600' },
  promo: { icon: Tag, chip: 'bg-emerald-50 text-emerald-600' },
  alerta: { icon: AlertTriangle, chip: 'bg-amber-50 text-amber-600' },
}

export default function Topbar({ onMenu }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('revendedor')
  const [notices, setNotices] = useState([])
  const [openBell, setOpenBell] = useState(false)

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

    // Carrega avisos ativos
    loadNotices()
  }, [])

  async function loadNotices() {
    const { data } = await supabase
      .from('notices')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(30)
    setNotices(data ?? [])
  }

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Revendedor'
  const initial = name?.[0]?.toUpperCase() ?? 'P'
  const roleLabel = role === 'admin' ? 'Admin' : 'Revendedor'

  const recent = notices.slice(0, 5)
  const history = notices.slice(5)

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
        {/* ===== SININHO COM AVISOS ===== */}
        <div className="relative">
          <button
            onClick={() => setOpenBell((v) => !v)}
            className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            aria-label="Notificações"
          >
            <Bell size={18} />
            {recent.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {recent.length}
              </span>
            )}
          </button>

          {openBell && (
            <>
              {/* Fecha ao clicar fora */}
              <div className="fixed inset-0 z-40" onClick={() => setOpenBell(false)} />
              <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">Notificações</p>
                  <button
                    onClick={() => setOpenBell(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                    aria-label="Fechar"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notices.length === 0 && (
                    <p className="px-4 py-8 text-center text-sm text-slate-400">
                      Nenhum aviso por aqui ainda.
                    </p>
                  )}

                  {recent.map((n) => {
                    const meta = TYPE_META[n.type] || TYPE_META.info
                    const Icon = meta.icon
                    return (
                      <div key={n.id} className="flex gap-3 border-b border-slate-50 px-4 py-3">
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta.chip}`}>
                          <Icon size={14} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                          <p className="mt-0.5 whitespace-pre-line text-xs text-slate-500">{n.message}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{formatDate(n.created_at)}</p>
                        </div>
                      </div>
                    )
                  })}

                  {history.length > 0 && (
                    <div className="px-4 pb-2 pt-3">
                      <p className="pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Histórico
                      </p>
                      {history.map((n) => {
                        const meta = TYPE_META[n.type] || TYPE_META.info
                        const Icon = meta.icon
                        return (
                          <div key={n.id} className="flex gap-3 py-2 opacity-70">
                            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.chip}`}>
                              <Icon size={12} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-700">{n.title}</p>
                              <p className="text-[11px] text-slate-400">{formatDate(n.created_at)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

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
