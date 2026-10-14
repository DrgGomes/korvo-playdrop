'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL, formatDate, orderStatusColor, orderStatusLabel } from '@/lib/utils'
import { Search, TrendingUp, Plus, PackageOpen } from 'lucide-react'

const ALL_STATUS = ['novo', 'em_producao', 'enviado', 'entregue', 'cancelado', 'devolucao']

export default function VendasPage() {
  const [orders, setOrders] = useState([])
  const [itemCounts, setItemCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('todos')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500)
    const list = data ?? []
    setOrders(list)

    // Conta os itens de cada pedido
    if (list.length > 0) {
      const ids = list.map((o) => o.id)
      const { data: items } = await supabase
        .from('order_items')
        .select('order_id, quantity')
        .in('order_id', ids)
      const counts = {}
      ;(items ?? []).forEach((i) => {
        counts[i.order_id] = (counts[i.order_id] || 0) + Number(i.quantity || 0)
      })
      setItemCounts(counts)
    }

    setLoading(false)
  }

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const okStatus = status === 'todos' || o.status === status
      const q = query.toLowerCase()
      const okQuery =
        !q ||
        (o.order_number || '').toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q)
      return okStatus && okQuery
    })
  }, [orders, query, status])

  const totalVendido = filtered.reduce((s, o) => s + Number(o.selling_price || 0), 0)

  const statusChips = [
    { value: 'todos', label: 'Todos' },
    ...ALL_STATUS.map((s) => ({ value: s, label: orderStatusLabel(s) })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Vendas</h1>
          <p className="mt-1 text-sm text-slate-500">
            {orders.length} pedido(s) no total ·{' '}
            <span className="font-semibold text-indigo-600">{formatBRL(totalVendido)}</span> vendidos no filtro atual
          </p>
        </div>
        <Link
          href="/dashboard/pedido"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Plus size={16} /> Novo pedido
        </Link>
      </div>

      {/* Busca + filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nº do pedido ou cliente..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusChips.map((c) => (
            <button
              key={c.value}
              onClick={() => setStatus(c.value)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                status === c.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Estado vazio */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <PackageOpen size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Nenhuma venda por aqui</h2>
          <p className="mt-1 text-sm text-slate-500">
            {orders.length === 0
              ? 'Quando você fizer seu primeiro pedido, ele aparece aqui.'
              : 'Nenhuma venda encontrada com esse filtro.'}
          </p>
        </div>
      )}

      {/* Tabela */}
      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">Pedido</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Itens</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                        <td className="px-6 py-3">
                      <Link
                        href={`/dashboard/pedido/${o.id}`}
                        className="font-semibold text-indigo-600 underline-offset-2 hover:underline"
                      >
                        {o.order_number || o.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-900">{o.customer_name || '—'}</p>
                      {o.customer_phone && <p className="text-xs text-slate-400">{o.customer_phone}</p>}
                    </td>
                    <td className="px-6 py-3 text-slate-500">{formatDate(o.created_at)}</td>
                    <td className="px-6 py-3">{itemCounts[o.id] || 0} peça(s)</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusColor(o.status)}`}>
                        {orderStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-900">
                      {formatBRL(o.selling_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dica */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
          <TrendingUp size={18} className="mt-0.5 shrink-0 text-indigo-600" />
          <p className="text-sm text-slate-600">
            Dica: acompanhe o status no <b>Admin</b> — a PlayDrop estampa o DTF, embala etiquetado e
            envia direto ao seu cliente. O código de rastreio aparece no pedido quando for enviado.
          </p>
        </div>
      )}
    </div>
  )
}
