'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL, formatDate, orderStatusLabel } from '@/lib/utils'
import {
  Search, ShoppingCart, FileText, Truck, Eye, X, Download, User, Wallet, Printer,
} from 'lucide-react'

const ALL_STATUS = [
  'todos', 'novo', 'em_producao', 'em_separacao', 'separado',
  'enviado', 'entregue', 'cancelado', 'devolucao',
]

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState([])
  const [profiles, setProfiles] = useState({})
  const [attachments, setAttachments] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [query, setQuery] = useState('')

  // Modal de detalhes do pedido
  const [viewOrder, setViewOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [orderAttFiles, setOrderAttFiles] = useState([])

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
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    if (viewOrder?.id === id) setViewOrder((v) => ({ ...v, status }))
  }

  // ===== ABRIR PEDIDO NO MODAL =====
  async function openOrder(o) {
    setViewOrder(o)
    setOrderItems([])
    setOrderAttFiles([])

    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', o.id)
    setOrderItems(items ?? [])

    const { data: atts } = await supabase
      .from('order_attachments')
      .select('*')
      .eq('order_id', o.id)
    setOrderAttFiles(atts ?? [])
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

  const viewReseller = viewOrder ? profiles[viewOrder.user_id] : null
  const viewTotalCost = orderItems.reduce((s, it) => s + Number(it.unit_cost || 0) * Number(it.quantity || 0), 0)

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
                        <button
                          onClick={() => openOrder(o)}
                          className="font-semibold text-indigo-600 underline-offset-2 hover:underline"
                        >
                          {o.order_number || o.id.slice(0, 8)}
                        </button>
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
                          <button
                            onClick={() => openOrder(o)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                            aria-label="Ver detalhes"
                          >
                            <Eye size={15} />
                          </button>
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

      {/* ===== MODAL: DETALHES DO PEDIDO ===== */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Pedido {viewOrder.order_number || viewOrder.id.slice(0, 8)}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">{formatDate(viewOrder.created_at)}</p>
              </div>
              <button
                onClick={() => setViewOrder(null)}
                className="shrink-0 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cliente do pedido + status */}
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <User size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {viewOrder.customer_name || '—'}
                  </p>
                  <p className="text-xs text-slate-400">Cliente final</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <select
                  value={viewOrder.status}
                  onChange={(e) => updateStatus(viewOrder.id, e.target.value)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium outline-none focus:border-indigo-500 ${statusColor[viewOrder.status] || ''}`}
                >
                  {ALL_STATUS.filter((s) => s !== 'todos').map((s) => (
                    <option key={s} value={s}>{orderStatusLabel(s)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Revendedor */}
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Revendedor</p>
              <p className="mt-1 font-semibold text-slate-800">
                {viewReseller?.full_name || viewReseller?.email || '—'}
              </p>
              {viewReseller?.email && (
                <p className="text-xs text-slate-400">{viewReseller.email}</p>
              )}
            </div>

            {/* Anexos */}
            <section className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Anexos (etiqueta / NF)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {orderAttFiles.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhum anexo neste pedido ainda.</p>
                ) : (
                  orderAttFiles.map((a) => {
                    const isEtq = a.type === 'etiqueta'
                    const url = a.file_url || a.url
                    return (
                      <a
                        key={a.id || a.type}
                        href={url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          isEtq
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        }`}
                      >
                        {isEtq ? <Truck size={13} /> : <FileText size={13} />}
                        {isEtq ? 'Etiqueta' : 'Nota fiscal'}
                        {url && <Download size={12} />}
                      </a>
                    )
                  })
                )}
              </div>
            </section>

            {/* Itens */}
            <section className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Itens do pedido</p>
              {orderItems.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">Carregando itens...</p>
              ) : (
                <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-2">Produto</th>
                        <th className="px-4 py-2">Cor</th>
                        <th className="px-4 py-2">Tam.</th>
                        <th className="px-4 py-2">Qtd</th>
                        <th className="px-4 py-2 text-right">Custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((it, i) => (
                        <tr key={it.id || i} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-2 font-medium text-slate-800">
                            {it.product_name || it.name || 'Produto'}
                          </td>
                          <td className="px-4 py-2 text-slate-500">{it.color || '—'}</td>
                          <td className="px-4 py-2 text-slate-500">{it.size || '—'}</td>
                          <td className="px-4 py-2 font-semibold">{it.quantity ?? 1}</td>
                          <td className="px-4 py-2 text-right text-slate-500">
                            {it.unit_cost != null ? formatBRL(it.unit_cost) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Financeiro */}
<button
              onClick={() => window.open(`/dashboard/cupom?id=${viewOrder.id}`, '_blank')}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Printer size={16} /> Imprimir cupom do pedido
            </button>
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                <Wallet size={13} /> Financeiro
              </div>
              <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Custo das peças</p>
                  <p className="font-bold text-slate-800">{formatBRL(viewTotalCost || viewOrder.total_cost)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Venda</p>
                  <p className="font-bold text-slate-800">{formatBRL(viewOrder.selling_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Margem</p>
                  <p className="font-bold text-emerald-600">
                    {formatBRL(Number(viewOrder.selling_price || 0) - Number(viewTotalCost || viewOrder.total_cost || 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
