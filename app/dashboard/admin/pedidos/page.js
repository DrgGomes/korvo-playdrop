'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL, formatDate, orderStatusLabel } from '@/lib/utils'
import { Search, ShoppingCart, FileText, Truck, Eye } from 'lucide-react'

const ALL_STATUS = ['todos', 'novo', 'em_producao', 'em_separacao', 'separado', 'enviado', 'entregue', 'cancelado', 'devolucao']

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState([])
  const [profiles, setProfiles] = useState({})
  const [attachments, setAttachments] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [query, setQuery] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: o } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    const list = o ?? []
    setOrders(list)

    // Nomes dos revendedores
    const userIds = [...new Set(list.map((x) => x.user_id).filter(Boolean))]
    if (userIds.length > 0) {
      const { data: p } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds)
      const pmap = {}
      ;(p ?? []).forEach((prof) => { pmap[prof.id] = prof })
      setProfiles(pmap)
    }

    // Anexos (etiqueta/NF) de cada pedido
    if (list.length > 0) {
      const ids = list.map((x) => x.id)
      const { data: att } = await supabase
        .from('order_attachments')
        .select('order_id, type')
        .in('order_id', ids)
      const amap = {}
      ;(att ?? []).forEach((a) => {
        if (!amap[a.order_id]) amap[a.order_id] = { etiqueta: false, nf: false }
        amap[a.order_id][a.type] = true
      })
      setAttachments(amap)
    }

    setLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    load()
  }

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const okStatus = filter === 'todos' || o.status === filter
      const num = o.order_number || o.id.slice(0, 8)
      const reseller = profiles[o.user_id]?.email || o.user_id?.slice(0, 8) || ''
      const okQuery =
        !query ||
        num.toLowerCase().includes(query.toLowerCase()) ||
        reseller.toLowerCase().includes(query.toLowerCase())
      return okStatus && okQuery
    })
  }, [orders, filter, query, profiles])

  const counts = {}
  orders.forEach((o) => {
    counts[o.status] = (counts[o.status] || 0) + 1
  })

  const tabs = ALL_STATUS.map((s) => ({
    value: s,
    label: s === 'todos' ? 'Todos' : orderStatusLabel(s),
    count: s === 'todos' ? orders.length : counts[s] || 0,
  }))

  const statusColor = {
    novo: 'border-blue-200 bg-blue-50 text-blue-700',
    em_producao: 'border-amber-200 bg-amber-50 text-amber-700',
    em_separacao: 'border-orange-200 bg-orange-50 text-orange-700',
    separado: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    enviado: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    entregue: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cancelado: 'border-red-200 bg-red-50 text-red-700',
    devolucao: 'border-slate-200 bg-slate-100 text-slate-600',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Pedidos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Acompanhe o pipeline, mude os status e veja se a etiqueta/NF já foi anexada.
        </p>
      </div>

      {/* Filtros por status */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition ${
              filter === t.value
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 text-[11px] font-bold ${
                filter === t.value ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <Search size={16} className="text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por pedido ou revendedor..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Carregando pedidos...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ShoppingCart size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Nenhum pedido encontrado</h2>
          <p className="mt-1 text-sm text-slate-500">Nenhum pedido com esses filtros.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">Pedido</th>
                  <th className="px-6 py-3">Revendedor</th>
                  <th className="px-6 py-3">Anexos</th>
                  <th className="px-6 py-3">Itens</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const att = attachments[o.id]
                  const reseller = profiles[o.user_id]
                  return (
                    <tr key={o.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-6 py-3">
                        <Link
                          href={`/dashboard/pedido/${o.id}`}
                          className="font-semibold text-indigo-600 underline-offset-2 hover:underline"
                        >
                          {o.order_number || o.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-800">{reseller?.full_name || reseller?.email || 'Revendedor'}</p>
                        <p className="text-xs text-slate-400">{reseller?.email || o.user_id?.slice(0, 8) || ''}</p>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-1">
                          <span
                            title="Etiqueta"
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              att?.etiqueta ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Truck size={11} /> ETQ
                          </span>
                          <span
                            title="Nota fiscal"
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              att?.nf ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <FileText size={11} /> NF
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-500">{o.item_count ?? '—'}</td>
                      <td className="px-6 py-3 font-semibold">{formatBRL(o.selling_price)}</td>
                      <td className="px-6 py-3">
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className={`rounded-lg border px-2 py-1.5 text-xs font-medium outline-none focus:border-indigo-500 ${statusColor[o.status] || ''}`}
                        >
                          {ALL_STATUS.filter((s) => s !== 'todos').map((s) => (
                            <option key={s} value={s}>{orderStatusLabel(s)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3 text-slate-500">{formatDate(o.created_at)}</td>
                      <td className="px-6 py-3">
                        <div className="flex justify-end">
                          <Link
                            href={`/dashboard/pedido/${o.id}`}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                            aria-label="Ver detalhes"
                          >
                            <Eye size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
