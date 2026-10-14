'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL, formatDate, orderStatusColor, orderStatusLabel } from '@/lib/utils'
import { PackageOpen, Plus, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [banner, setBanner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setOrders(data ?? [])

    // Banner ativo do slot dashboard (o mais recente)
    const { data: b } = await supabase
      .from('banners')
      .select('*')
      .eq('slot', 'dashboard')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
    setBanner(b?.[0] ?? null)

    setLoading(false)
  }

  const cutoff = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - days)
    return d
  }, [days])

  const filtered = useMemo(
    () => orders.filter((o) => new Date(o.created_at) >= cutoff),
    [orders, cutoff]
  )

  const metrics = useMemo(() => {
    const faturamento = filtered.reduce((s, o) => s + Number(o.selling_price || 0), 0)
    const custo = filtered.reduce((s, o) => s + Number(o.total_cost || 0), 0)
    return { faturamento, custo, lucro: faturamento - custo, pedidos: filtered.length }
  }, [filtered])

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Revendedor'

  const cards = [
    { label: 'Faturamento', value: formatBRL(metrics.faturamento), icon: '💰' },
    { label: 'Pedidos', value: String(metrics.pedidos), icon: '📦' },
    { label: 'Custo das peças', value: formatBRL(metrics.custo), icon: '🧾' },
    { label: 'Lucro', value: formatBRL(metrics.lucro), icon: '📈' },
  ]

  const recent = filtered.slice(0, 8)

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Olá, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-slate-500">Acompanhe suas vendas do PlayDrop em tempo real.</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                days === d ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {d} dias
            </button>
          ))}
        </div>
      </div>

      {/* ===== BANNER (só renderiza se existir) ===== */}
      {banner && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {banner.link_url ? (
            <Link href={banner.link_url} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={banner.image_url} alt={banner.title || 'Banner'} className="w-full h-auto object-cover" />
            </Link>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner.image_url} alt={banner.title || 'Banner'} className="w-full h-auto object-cover" />
          )}
        </div>
      )}

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{c.value}</p>
            <span className="mt-2 inline-block text-lg">{c.icon}</span>
          </div>
        ))}
      </div>

      {/* Estado vazio / gráfico */}
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <PackageOpen size={30} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Nenhuma venda ainda</h2>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Escolha suas camisetas no catálogo, defina seu preço e anuncie no Mercado Livre
              ou Shopee com títulos prontos. Quando vender, crie seu pedido aqui.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/catalogo"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Ver catálogo <ArrowRight size={16} />
              </Link>
              <Link
                href="/dashboard/vendas"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <Plus size={16} /> Minhas vendas
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            O gráfico de vendas por dia aparecerá aqui assim que houver pedidos no período selecionado.
          </p>
        )}
      </div>

      {/* Pedidos recentes */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">Pedidos recentes</h3>
          <Link href="/dashboard/vendas" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Ver todos →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">
            Seus pedidos aparecerão aqui quando você fizer sua primeira venda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">Pedido</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-6 py-3 font-semibold text-indigo-600">{o.order_number || o.id.slice(0, 8)}</td>
                    <td className="px-6 py-3">{o.customer_name || '—'}</td>
                    <td className="px-6 py-3 text-slate-500">{formatDate(o.created_at)}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusColor(o.status)}`}>
                        {orderStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-semibold">{formatBRL(o.selling_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
