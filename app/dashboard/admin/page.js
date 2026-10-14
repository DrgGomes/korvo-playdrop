'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL } from '@/lib/utils'
import {
  ShoppingCart, Package, Truck, CheckCircle2, ArrowRight, Wallet, TrendingUp, Settings,
} from 'lucide-react'

export default function AdminDashboard() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [{ data: o }, { data: pr }] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('products').select('*').order('name'),
    ])
    setOrders(o ?? [])
    setProducts(pr ?? [])
  }

  const counts = {
    novo: orders.filter((o) => o.status === 'novo').length,
    em_producao: orders.filter((o) => o.status === 'em_producao').length,
    em_separacao: orders.filter((o) => o.status === 'em_separacao').length,
    separado: orders.filter((o) => o.status === 'separado').length,
    enviado: orders.filter((o) => o.status === 'enviado').length,
    entregue: orders.filter((o) => o.status === 'entregue').length,
  }

  const faturamento = orders
    .filter((o) => ['enviado', 'entregue'].includes(o.status))
    .reduce((s, o) => s + Number(o.selling_price || 0), 0)

  const custoTotal = orders
    .filter((o) => ['enviado', 'entregue'].includes(o.status))
    .reduce((s, o) => s + Number(o.total_cost || 0), 0)

  const activeProducts = products.filter((p) => p.active).length

  const cards = [
    { label: 'Pedidos novos', value: counts.novo, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600', href: '/dashboard/admin/pedidos' },
    { label: 'Em separação', value: counts.em_separacao, icon: Package, color: 'bg-orange-50 text-orange-600', href: '/dashboard/admin/pedidos' },
    { label: 'Enviados', value: counts.enviado, icon: Truck, color: 'bg-violet-50 text-violet-600', href: '/dashboard/admin/pedidos' },
    { label: 'Entregues', value: counts.entregue, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', href: '/dashboard/admin/pedidos' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Visão geral da operação PlayDrop by Korvo Ecossistema.
        </p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Link key={c.label} href={c.href} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
                <Icon size={20} />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{c.value}</p>
              <p className="text-sm font-medium text-slate-500">{c.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Financeiro */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <TrendingUp size={16} className="text-indigo-600" /> Faturamento (enviados/entregues)
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatBRL(faturamento)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Wallet size={16} className="text-amber-600" /> Custo das peças
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatBRL(custoTotal)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Package size={16} className="text-emerald-600" /> Produtos ativos
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{activeProducts}</p>
        </div>
      </div>

      {/* Acessos rápidos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: '/dashboard/admin/pedidos', label: 'Gerenciar pedidos', desc: 'Pipeline, status e anexos', icon: ShoppingCart },
          { href: '/dashboard/admin/relatorios', label: 'Relatórios', desc: 'Exportar e ver ranking', icon: TrendingUp },
          { href: '/dashboard/admin/produtos', label: 'Catálogo', desc: 'Cadastrar e editar produtos', icon: Package },
          { href: '/dashboard/admin/configuracoes', label: 'Configurações', desc: 'Custos, cores e tamanhos', icon: Settings },
        ].map((a) => {
          const Icon = a.icon
          return (
            <Link key={a.href} href={a.href} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">{a.label}</p>
                <p className="text-xs text-slate-500">{a.desc}</p>
              </div>
              <ArrowRight size={16} className="text-slate-300 transition group-hover:text-indigo-600" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
