'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL, formatDate, orderStatusLabel } from '@/lib/utils'
import { Wallet, AlertCircle, CheckCircle2, BadgeCheck } from 'lucide-react'

export default function FinanceiroPage() {
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [payingId, setPayingId] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: o }, { data: p }] = await Promise.all([
      supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(500),
      supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(500),
    ])
    setOrders(o ?? [])
    setPayments(p ?? [])
    setLoading(false)
  }

  // Período
  const cutoff = useMemo(() => {
    if (period === 'tudo') return null
    const d = new Date()
    d.setDate(d.getDate() - Number(period))
    return d
  }, [period])

  const filtered = useMemo(
    () => (cutoff ? orders.filter((o) => new Date(o.created_at) >= cutoff) : orders),
    [orders, cutoff]
  )

  // IDs de pedidos já pagos
  const paidOrderIds = useMemo(() => {
    const set = new Set()
    payments.forEach((p) => {
      if (p.status === 'pago' && p.order_id) set.add(p.order_id)
    })
    return set
  }, [payments])

  // Pendências: pedidos não cancelados sem pagamento pago
  const pendentes = useMemo(
    () => filtered.filter((o) => o.status !== 'cancelado' && !paidOrderIds.has(o.id)),
    [filtered, paidOrderIds]
  )

  // Pagamentos registrados
  const pagos = useMemo(
    () => payments.filter((p) => p.status === 'pago'),
    [payments]
  )

  const metrics = useMemo(() => {
    const faturamento = filtered.reduce((s, o) => s + Number(o.selling_price || 0), 0)
    const custos = filtered.reduce((s, o) => s + Number(o.total_cost || 0), 0)
    return { faturamento, custos, lucro: faturamento - custos, pedidos: filtered.length }
  }, [filtered])

  const totalPendente = pendentes.reduce((s, o) => s + Number(o.total_cost || 0), 0)

  async function markPaid(order) {
    setPayingId(order.id)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('payments').insert({
      user_id: user.id,
      order_id: order.id,
      amount: Number(order.total_cost || 0),
      status: 'pago',
      method: 'pix',
      paid_at: new Date().toISOString(),
    })
    setPayingId(null)
    load()
  }

  const cards = [
    { label: 'Faturamento (período)', value: formatBRL(metrics.faturamento), icon: '💰' },
    { label: 'Custos das peças', value: formatBRL(metrics.custos), icon: '🧾' },
    { label: 'Seu lucro', value: formatBRL(metrics.lucro), icon: '📈', highlight: true },
    { label: 'Pedidos no período', value: String(metrics.pedidos), icon: '📦' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Financeiro</h1>
          <p className="mt-1 text-sm text-slate-500">
            Faturamento, custos e lucro — por pedido e por período. Sem dados inventados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { v: '7', l: '7 dias' },
            { v: '30', l: '30 dias' },
            { v: '90', l: '90 dias' },
            { v: 'tudo', l: 'Tudo' },
          ].map((p) => (
            <button
              key={p.v}
              onClick={() => setPeriod(p.v)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                period === p.v
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-2xl border p-5 ${
              c.highlight ? 'border-indigo-200 bg-indigo-50/70' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            <p className={`mt-2 text-2xl font-extrabold ${c.highlight ? 'text-indigo-700' : 'text-slate-900'}`}>
              {c.value}
            </p>
            <span className="mt-2 inline-block text-lg">{c.icon}</span>
          </div>
        ))}
      </div>

      {/* Pendências */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <AlertCircle size={18} className="text-amber-500" />
          <h3 className="font-bold text-slate-900">Pendências de pagamento</h3>
          <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
            {formatBRL(totalPendente)}
          </span>
        </div>

        {pendentes.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            Nenhuma pendência no período. Tudo em dia! ✅
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">Pedido</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Status do pedido</th>
                  <th className="px-6 py-3">Custo (pago à PlayDrop)</th>
                  <th className="px-6 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {pendentes.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-6 py-3 font-semibold text-indigo-600">
                      {o.order_number || o.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-3 text-slate-500">{formatDate(o.created_at)}</td>
                    <td className="px-6 py-3">{orderStatusLabel(o.status)}</td>
                    <td className="px-6 py-3 font-semibold text-slate-900">{formatBRL(o.total_cost)}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => markPaid(o)}
                        disabled={payingId === o.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <CheckCircle2 size={14} />
                        {payingId === o.id ? 'Confirmando...' : 'Marcar como pago'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagamentos registrados */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <BadgeCheck size={18} className="text-emerald-500" />
          <h3 className="font-bold text-slate-900">Pagamentos registrados</h3>
        </div>

        {pagos.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            Quando você confirmar um pagamento, ele aparece aqui com a data.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">Pedido</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Forma</th>
                  <th className="px-6 py-3">Pago em</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => {
                  const order = orders.find((o) => o.id === p.order_id)
                  return (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-6 py-3 font-semibold text-indigo-600">
                        {order?.order_number || p.order_id?.slice(0, 8)}
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-900">{formatBRL(p.amount)}</td>
                      <td className="px-6 py-3 uppercase text-slate-500">{p.method || '—'}</td>
                      <td className="px-6 py-3 text-slate-500">{formatDate(p.paid_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lucro por pedido */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <Wallet size={18} className="text-indigo-500" />
          <h3 className="font-bold text-slate-900">Lucro por pedido</h3>
        </div>

        {filtered.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            Sem pedidos no período selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">Pedido</th>
                  <th className="px-6 py-3">Vendido</th>
                  <th className="px-6 py-3">Custo</th>
                  <th className="px-6 py-3 text-right">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const lucro = Number(o.selling_price || 0) - Number(o.total_cost || 0)
                  return (
                    <tr key={o.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-6 py-3 font-semibold text-indigo-600">
                        {o.order_number || o.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-3 text-slate-700">{formatBRL(o.selling_price)}</td>
                      <td className="px-6 py-3 text-slate-700">{formatBRL(o.total_cost)}</td>
                      <td
                        className={`px-6 py-3 text-right font-semibold ${
                          lucro >= 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {formatBRL(lucro)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
