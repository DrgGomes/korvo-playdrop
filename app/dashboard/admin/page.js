'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL, formatDate, orderStatusLabel } from '@/lib/utils'
import { ShieldAlert, Package, ShoppingCart, Truck, CheckCircle2, ArrowRight } from 'lucide-react'

const ALL_STATUS = ['novo', 'em_producao', 'enviado', 'entregue', 'cancelado', 'devolucao']

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    setIsAdmin(profile?.role === 'admin')

    if (profile?.role === 'admin') {
      const [{ data: o }, { data: pr }] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('products').select('*').order('name'),
      ])
      setOrders(o ?? [])
      setProducts(pr ?? [])
    }
  }

  async function updateStatus(id, status) {
    await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    load()
  }

  if (isAdmin === null) {
    return <p className="text-sm text-slate-400">Verificando acesso...</p>
  }

  if (isAdmin === false) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <ShieldAlert size={26} />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-slate-900">Acesso restrito</h1>
        <p className="mt-2 text-sm text-slate-500">
          Esta área é exclusiva da administração do ecossistema Korvo. Se você é o administrador,
          finalize a configuração do seu perfil no passo de Admin.
        </p>
      </div>
    )
  }

  const counts = { novo: 0, em_producao: 0, enviado: 0, entregue: 0 }
  orders.forEach((o) => {
    if (counts[o.status] !== undefined) counts[o.status]++
  })

  const activeProducts = products.filter((p) => p.active).length
  const recent = orders.slice(0, 10)

  const cards = [
    { label: 'Pedidos novos', value: counts.novo, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { label: 'Em produção', value: counts.em_producao, icon: Truck, color: 'bg-amber-50 text-amber-600' },
    { label: 'Enviados', value: counts.enviado, icon: Truck, color: 'bg-violet-50 text-violet-600' },
    { label: 'Entregues', value: counts.entregue, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Admin — PlayDrop</h1>
          <p className="mt-1 text-sm text-slate-500">Operação do ecossistema Korvo: pipeline, catálogo e avisos.</p>
        </div>
        <Link
          href="/dashboard/admin/produtos"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Package size={16} /> Gerenciar catálogo
        </Link>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
                <Icon size={20} />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{c.value}</p>
              <p className="text-sm font-medium text-slate-500">{c.label}</p>
            </div>
          )
        })}
      </div>

      {/* Catálogo resumido */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Produtos no catálogo</p>
            <p className="text-2xl font-extrabold text-slate-900">
              {activeProducts} <span className="text-sm font-medium text-slate-400">ativos</span>
            </p>
          </div>
          <Link
            href="/dashboard/admin/produtos"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Gerenciar <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Pipeline de pedidos */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">Pipeline de pedidos</h3>
          <p className="text-sm text-slate-500">Mude o status conforme produz, envia e entrega.</p>
        </div>

        {recent.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">
            Nenhum pedido ainda. Quando os revendedores pedirem, eles aparecem aqui.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">Pedido</th>
                  <th className="px-6 py-3">Revendedor</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 last:border-0">
                                          <Link
                        href={`/dashboard/pedido/${o.id}`}
                        className="font-semibold text-indigo-600 underline-offset-2 hover:underline"
                      >
                        {o.order_number || o.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-3">{o.user_id?.slice(0, 8) || '—'}</td>
                    <td className="px-6 py-3 text-slate-500">{formatDate(o.created_at)}</td>
                    <td className="px-6 py-3 font-semibold">{formatBRL(o.selling_price)}</td>
                    <td className="px-6 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
                      >
                        {ALL_STATUS.map((s) => (
                          <option key={s} value={s}>
                            {orderStatusLabel(s)}
                          </option>
                        ))}
                      </select>
                    </td>
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
