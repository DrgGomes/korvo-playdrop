'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL, formatDate } from '@/lib/utils'
import { RotateCcw, AlertTriangle } from 'lucide-react'

const RETURN_STATUS = {
  solicitada: { label: 'Solicitada', color: 'bg-blue-100 text-blue-700' },
  aprovada: { label: 'Aprovada', color: 'bg-amber-100 text-amber-700' },
  recusada: { label: 'Recusada', color: 'bg-red-100 text-red-700' },
  concluida: { label: 'Concluída', color: 'bg-emerald-100 text-emerald-700' },
}

export default function DevolucoesPage() {
  const [orders, setOrders] = useState([])
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ order_id: '', reason: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: o }, { data: r }] = await Promise.all([
      supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['entregue', 'enviado'])
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('returns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200),
    ])
    setOrders(o ?? [])
    setReturns(r ?? [])
    setLoading(false)
  }

  const orderById = {}
  orders.forEach((o) => (orderById[o.id] = o))

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.order_id) return setError('Escolha o pedido da devolução.')
    if (!form.reason.trim()) return setError('Descreva o motivo da devolução.')

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Sessão expirada. Entre novamente.')
      setSubmitting(false)
      return
    }

    const { error: err } = await supabase.from('returns').insert({
      user_id: user.id,
      order_id: form.order_id,
      reason: form.reason.trim(),
      status: 'solicitada',
    })

    if (err) {
      setError('Não foi possível registrar a devolução. Tente novamente.')
      setSubmitting(false)
      return
    }

    setForm({ order_id: '', reason: '' })
    setSubmitting(false)
    load()
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Devoluções</h1>
        <p className="mt-1 text-sm text-slate-500">
          Precisa devolver ou trocar uma peça? Registre aqui e acompanhe o status.
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
          <RotateCcw size={18} className="text-indigo-600" />
          Solicitar devolução
        </h2>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Pedido</label>
            {loading ? (
              <p className="text-sm text-slate-400">Carregando pedidos...</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-slate-500">
                Você ainda não tem pedidos enviados ou entregues para devolver.
              </p>
            ) : (
              <select
                value={form.order_id}
                onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                className={inputClass}
              >
                <option value="">Selecione o pedido...</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.order_number || o.id.slice(0, 8)} — {o.customer_name || 'sem nome'} ({formatBRL(o.selling_price)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className={labelClass}>Motivo da devolução</label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Ex.: veio com defeito na estampa, tamanho errado, cliente desistiu..."
              className={inputClass}
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || orders.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Registrar devolução'}
          </button>
        </div>
      </form>

      {/* Lista de devoluções */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">Suas devoluções</h3>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">Carregando...</p>
        ) : returns.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">
            Nenhuma devolução registrada até agora.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {returns.map((r) => {
              const st = RETURN_STATUS[r.status] || RETURN_STATUS.solicitada
              const order = orderById[r.order_id]
              return (
                <div key={r.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Pedido {order?.order_number || r.order_id?.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Solicitada em {formatDate(r.created_at)} ·{' '}
                        {order ? formatBRL(order.selling_price) : '—'}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  {r.reason && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-slate-400" />
                      {r.reason}
                    </p>
                  )}
                  {r.refund_amount > 0 && (
                    <p className="mt-2 text-sm font-medium text-emerald-600">
                      Reembolso: {formatBRL(r.refund_amount)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="rounded-2xl bg-slate-100 px-4 py-3 text-xs text-slate-500">
        O status da devolução é atualizado pela equipe do ecossistema Korvo depois da análise. Em
        caso de peça com defeito, o reembolso cobre o valor que você pagou à PlayDrop.
      </p>
    </div>
  )
}
