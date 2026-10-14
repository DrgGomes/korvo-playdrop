'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL, formatDate } from '@/lib/utils'
import { BarChart3, Download, TrendingUp, Wallet, ShoppingCart, Trophy } from 'lucide-react'

export default function AdminRelatoriosPage() {
  const [orders, setOrders] = useState([])
  const [items, setItems] = useState([])
  const [period, setPeriod] = useState('30')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: o } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)
    const list = o ?? []
    setOrders(list)

    if (list.length > 0) {
      const ids = list.map((x) => x.id)
      const { data: it } = await supabase
        .from('order_items')
        .select('order_id, product_name, quantity, unit_price')
        .in('order_id', ids)
      setItems(it ?? [])
    }
    setLoading(false)
  }

  const inPeriod = useMemo(() => {
    if (period === 'all') return orders
    const days = Number(period)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return orders.filter((o) => new Date(o.created_at) >= cutoff)
  }, [orders, period])

  // Considera pedidos enviados/entregues como "realizados" no financeiro
  const realized = inPeriod.filter((o) => ['enviado', 'entregue'].includes(o.status))

  const faturamento = realized.reduce((s, o) => s + Number(o.selling_price || 0), 0)
  const custo = realized.reduce((s, o) => s + Number(o.total_cost || 0), 0)
  const lucro = faturamento - custo
  const pedidosRealizados = realized.length
  const totalPecas = inPeriod.reduce((s, o) => s + Number(o.item_count || 0), 0)

  // Ranking de produtos mais vendidos
  const ranking = useMemo(() => {
    const orderIdsInPeriod = new Set(inPeriod.map((o) => o.id))
    const agg = {}
    items.forEach((i) => {
      if (!orderIdsInPeriod.has(i.order_id)) return
      if (!agg[i.product_name]) agg[i.product_name] = { qty: 0, revenue: 0 }
      agg[i.product_name].qty += Number(i.quantity || 0)
      agg[i.product_name].revenue += Number(i.unit_price || 0) * Number(i.quantity || 0)
    })
    return Object.entries(agg)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)
  }, [items, inPeriod])

  // Exporta CSV (separador ; para abrir direitinho no Excel BR)
  function exportCsv() {
    if (inPeriod.length === 0) return
    const header = ['Pedido', 'Data', 'Status', 'Revendedor', 'Valor venda', 'Custo', 'Peças']
    const rows = inPeriod.map((o) => [
      o.order_number || o.id.slice(0, 8),
      formatDate(o.created_at),
      o.status,
      o.user_id || '',
      String(Number(o.selling_price || 0)).replace('.', ','),
      String(Number(o.total_cost || 0)).replace('.', ','),
      o.item_count || '',
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-playdrop-${period === 'all' ? 'todos' : `${period}dias`}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const periodLabel = period === 'all' ? 'Período: todo o histórico' : `Período: últimos ${period} dias`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Relatórios</h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe o desempenho e exporte os dados da operação.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={inPeriod.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Filtro de período */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { v: '7', l: '7 dias' },
          { v: '30', l: '30 dias' },
          { v: '90', l: '90 dias' },
          { v: 'all', l: 'Todo o histórico' },
        ].map((p) => (
          <button
            key={p.v}
            onClick={() => setPeriod(p.v)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              period === p.v ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p.l}
          </button>
        ))}
        <span className="ml-2 text-xs text-slate-400">{periodLabel}</span>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Carregando relatórios...</p>
      ) : (
        <>
          {/* Cards financeiros */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <TrendingUp size={20} />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{formatBRL(faturamento)}</p>
              <p className="text-sm font-medium text-slate-500">Faturamento (enviados/entregues)</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Wallet size={20} />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{formatBRL(custo)}</p>
              <p className="text-sm font-medium text-slate-500">Custo das peças</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <BarChart3 size={20} />
              </div>
              <p className={`mt-3 text-2xl font-extrabold ${lucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {formatBRL(lucro)}
              </p>
              <p className="text-sm font-medium text-slate-500">Lucro</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShoppingCart size={20} />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{pedidosRealizados}</p>
              <p className="text-sm font-medium text-slate-500">Pedidos enviados/entregues</p>
            </div>
          </div>

          {/* Ranking de produtos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <Trophy size={18} className="text-amber-500" /> Produtos mais vendidos
            </h3>
            {ranking.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma venda no período.</p>
            ) : (
              <div className="space-y-2">
                {ranking.map((r, idx) => (
                  <div key={r.name} className="flex items-center gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{r.name}</p>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${Math.round((r.qty / ranking[0].qty) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-900">{r.qty} peça(s)</p>
                      <p className="text-xs text-slate-400">{formatBRL(r.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
