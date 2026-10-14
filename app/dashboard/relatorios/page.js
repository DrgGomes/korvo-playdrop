'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL } from '@/lib/utils'
import { BarChart3, Download, FileSpreadsheet, Trophy, PackageOpen } from 'lucide-react'

export default function RelatoriosPage() {
  const [orders, setOrders] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: o } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500)
    const list = o ?? []
    setOrders(list)

    if (list.length > 0) {
      const ids = list.map((x) => x.id)
      const { data: it } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', ids)
      setItems(it ?? [])
    }
    setLoading(false)
  }

  const cutoff = useMemo(() => {
    if (period === 'tudo') return null
    const d = new Date()
    d.setDate(d.getDate() - Number(period))
    return d
  }, [period])

  const orderById = useMemo(() => {
    const map = {}
    orders.forEach((o) => (map[o.id] = o))
    return map
  }, [orders])

  const inPeriod = useCallback((dateStr) => {
    if (!cutoff) return true
    return new Date(dateStr) >= cutoff
  }, [cutoff])

  const ranking = useMemo(() => {
    const map = {}
    items.forEach((i) => {
      const order = orderById[i.order_id]
      if (!order) return
      if (!inPeriod(order.created_at)) return
      const name = i.product_name || 'Produto sem nome'
      if (!map[name]) {
        map[name] = { name, quantity: 0, revenue: 0, cost: 0, orders: new Set() }
      }
      map[name].quantity += Number(i.quantity || 0)
      map[name].revenue += Number(i.unit_price || 0) * Number(i.quantity || 0)
      map[name].cost += Number(i.unit_cost || 0) * Number(i.quantity || 0)
      map[name].orders.add(i.order_id)
    })
    return Object.values(map)
      .map((r) => ({ ...r, orders: r.orders.size, profit: r.revenue - r.cost }))
      .sort((a, b) => b.quantity - a.quantity)
  }, [items, orderById, inPeriod])

  const totalItems = ranking.reduce((s, r) => s + r.quantity, 0)
  const totalRevenue = ranking.reduce((s, r) => s + r.revenue, 0)
  const totalProfit = ranking.reduce((s, r) => s + r.profit, 0)

  function exportCSV() {
    const header = ['Produto', 'Qtd vendida', 'Faturamento (R$)', 'Custo (R$)', 'Lucro (R$)', 'Pedidos']
    const rows = ranking.map((r) => [
      r.name,
      r.quantity,
      r.revenue.toFixed(2),
      r.cost.toFixed(2),
      r.profit.toFixed(2),
      r.orders,
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `playdrop-relatorio-${period === 'tudo' ? 'tudo' : period + 'dias'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportXLSX() {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(
      ranking.map((r) => ({
        Produto: r.name,
        'Qtd vendida': r.quantity,
        Faturamento: Number(r.revenue.toFixed(2)),
        Custo: Number(r.cost.toFixed(2)),
        Lucro: Number(r.profit.toFixed(2)),
        Pedidos: r.orders,
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ranking')
    XLSX.writeFile(wb, `playdrop-relatorio-${period === 'tudo' ? 'tudo' : period + 'dias'}.xlsx`)
  }

  const periods = [
    { v: '7', l: '7 dias' },
    { v: '30', l: '30 dias' },
    { v: '90', l: '90 dias' },
    { v: 'tudo', l: 'Tudo' },
  ]

  const cards = [
    { label: 'Peças vendidas', value: String(totalItems), icon: '👕' },
    { label: 'Faturamento', value: formatBRL(totalRevenue), icon: '💰' },
    { label: 'Lucro no período', value: formatBRL(totalProfit), icon: '📈', highlight: true },
    { label: 'Produtos diferentes', value: String(ranking.length), icon: '🏷️' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Relatórios</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ranking dos seus produtos mais vendidos e exportação dos dados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {periods.map((p) => (
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

      {/* Cards resumo */}
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

      {/* Botões de exportação */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Download size={18} className="text-indigo-600" />
          <p className="text-sm font-semibold text-slate-800">Exportar relatório:</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={ranking.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
        >
          <FileSpreadsheet size={15} /> Baixar CSV
        </button>
        <button
          onClick={exportXLSX}
          disabled={ranking.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <FileSpreadsheet size={15} /> Baixar Excel (XLSX)
        </button>
      </div>

      {/* Ranking */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <Trophy size={18} className="text-amber-500" />
          <h3 className="font-bold text-slate-900">Ranking de produtos mais vendidos</h3>
        </div>

        {loading ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">Carregando relatório...</p>
        ) : ranking.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <PackageOpen size={22} />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Nenhum produto vendido no período. Quando você fizer pedidos, o ranking aparece aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Produto</th>
                  <th className="px-6 py-3">Qtd</th>
                  <th className="px-6 py-3">Pedidos</th>
                  <th className="px-6 py-3">Faturamento</th>
                  <th className="px-6 py-3">Custo</th>
                  <th className="px-6 py-3 text-right">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, idx) => (
                  <tr key={r.name} className="border-b border-slate-50 last:border-0">
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-700'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-600'
                            : idx === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-900">{r.name}</td>
                    <td className="px-6 py-3">{r.quantity} peça(s)</td>
                    <td className="px-6 py-3 text-slate-500">{r.orders}</td>
                    <td className="px-6 py-3">{formatBRL(r.revenue)}</td>
                    <td className="px-6 py-3 text-slate-500">{formatBRL(r.cost)}</td>
                    <td className="px-6 py-3 text-right font-semibold text-emerald-600">
                      {formatBRL(r.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
        <BarChart3 size={18} className="mt-0.5 shrink-0 text-indigo-600" />
        <p className="text-sm text-slate-600">
          Dica: use o ranking para decidir quais estampas divulgar mais — as que vendem melhor
          merecem mais anúncios no Mercado Livre e na Shopee.
        </p>
      </div>
    </div>
  )
}
