'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL, formatDate, orderStatusLabel } from '@/lib/utils'
import { PackageSearch, CheckCircle, XCircle, Package, Boxes, Truck, Search, X } from 'lucide-react'

const ACOES = [
  { status: 'em_separacao', label: 'EM SEPARAÇÃO', icon: Boxes, cor: 'bg-amber-500 hover:bg-amber-600' },
  { status: 'separado', label: 'EMBALADO', icon: Package, cor: 'bg-cyan-600 hover:bg-cyan-700' },
  { status: 'enviado', label: 'ENVIADO', icon: Truck, cor: 'bg-indigo-600 hover:bg-indigo-700' },
]

export default function AdminStatusPage() {
  const searchParams = useSearchParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [msg, setMsg] = useState(null)
  const [search, setSearch] = useState('')
  const searchRef = useRef(null)

  async function load(id) {
    const code = (id || '').trim()
    if (!code) return
    setLoading(true)
    setNotFound(false)
    setOrder(null)
    setMsg(null)

    const upper = code.toUpperCase()

    // 1) Tenta por ID completo (QR code usa o id com hífens)
    if (code.includes('-')) {
      const { data: o } = await supabase
        .from('orders')
        .select('*')
        .eq('id', code)
        .maybeSingle()
      if (o) {
        setOrder(o)
        setLoading(false)
        return
      }
    }

    // 2) Tenta por order_number exato (ignora maiúscula/minúscula)
    const { data: o2 } = await supabase
      .from('orders')
      .select('*')
      .ilike('order_number', upper)
      .maybeSingle()
    if (o2) {
      setOrder(o2)
      setLoading(false)
      return
    }

    // 3) Última tentativa: começa com o código (bipes às vezes truncam)
    const { data: o3 } = await supabase
      .from('orders')
      .select('*')
      .ilike('order_number', `${upper}%`)
      .limit(2)
    if (o3 && o3.length === 1) {
      setOrder(o3[0])
      setLoading(false)
      return
    }

    setNotFound(true)
    setLoading(false)
  }

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) load(id.trim())
    else setLoading(false)
    // Foco automático na busca (pro bipe funcionar direto)
    searchRef.current?.focus()
  }, [searchParams])

  async function updateStatus(status) {
    setMsg(null)
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', order.id)

    if (error) {
      setMsg({ ok: false, text: 'Erro ao atualizar: ' + error.message })
      return
    }

    setOrder((o) => ({ ...o, status }))
    setMsg({ ok: true, text: `Status atualizado para: ${orderStatusLabel(status)}` })
  }

  function submitSearch(e) {
    e.preventDefault()
    load(search)
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-900 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <PackageSearch size={20} />
          </span>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Atualizar pedido</h1>
            <p className="text-xs text-slate-400">QR code, código de barras ou digitação</p>
          </div>
        </div>

        {/* Barra de busca — digite OU bipe (Enter dispara) */}
        <form onSubmit={submitSearch} className="mt-5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 focus-within:border-indigo-500 focus-within:bg-white">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Bipe o código ou digite o nº do pedido..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              autoComplete="off"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setOrder(null); setNotFound(false); searchRef.current?.focus() }}
                className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-200"
                aria-label="Limpar"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Localizando pedido...</p>
        ) : notFound ? (
          <div className="mt-5 rounded-xl bg-red-50 p-4 text-center text-sm text-red-600">
            Pedido não encontrado. Confira o código lido.
          </div>
        ) : order ? (
          <>
            {/* Resumo do pedido localizado */}
            <div className="mt-5 rounded-2xl border border-slate-200 p-4">
              <p className="text-xl font-extrabold tracking-wide text-indigo-600">
                {order.order_number || order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Cliente: <b className="text-slate-700">{order.customer_name || '—'}</b>
              </p>
              <p className="text-sm text-slate-500">
                Data: {formatDate(order.created_at)} · Total: <b className="text-slate-700">{formatBRL(order.selling_price)}</b>
              </p>
              <p className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Status atual: {orderStatusLabel(order.status)}
              </p>
            </div>

            {/* 3 botões de ação */}
            <div className="mt-5 space-y-2.5">
              {ACOES.map(({ status, label, icon: Icon, cor }) => {
                const ativo = order.status === status
                return (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white transition ${cor} ${
                      ativo ? 'ring-2 ring-offset-2 ring-slate-900/30' : ''
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                    {ativo && ' ✓'}
                  </button>
                )
              })}
            </div>

            {msg && (
              <div
                className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                  msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}
              >
                {msg.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {msg.text}
              </div>
            )}
          </>
        ) : (
          <p className="py-10 text-center text-sm text-slate-400">
            Escaneie o QR, bipe o código de barras ou digite o número do pedido.
          </p>
        )}
      </div>
    </div>
  )
}
