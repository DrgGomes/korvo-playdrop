'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL } from '@/lib/utils'
import { Shirt, ShoppingCart, ArrowRight, Check, Minus, Plus } from 'lucide-react'

function NovoPedidoContent() {
  const [products, setProducts] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from('products').select('*').eq('active', true).order('name')
    setProducts(data ?? [])
    const pid = searchParams.get('produto')
    if (pid) setSelectedId(pid)
    setLoading(false)
  }

  const product = products.find((p) => p.id === selectedId)

  async function createOrder() {
    if (!product) {
      alert('Selecione um produto do catálogo.')
      return
    }
    if (!color || !size) {
      alert('Selecione a cor e o tamanho.')
      return
    }
    if (qty < 1) {
      alert('Informe a quantidade.')
      return
    }
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const totalCost = Number(product.base_cost || 0) * qty
    const sellingPrice = Number(product.suggested_price || 0) * qty

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        selling_price: sellingPrice,
        total_cost: totalCost,
        status: 'novo',
      })
      .select()
      .single()

    if (error || !order) {
      alert('Erro ao criar o pedido. Tente novamente.')
      setSubmitting(false)
      return
    }

    await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      color,
      size,
      quantity: qty,
      unit_price: Number(product.base_cost || 0),
    })

    setSubmitting(false)
    router.push(`/dashboard/pedido/${order.id}`)
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Novo pedido</h1>
        <p className="mt-1 text-sm text-slate-500">
          Escolha o produto, a cor, o tamanho e a quantidade. Ao finalizar, anexe a etiqueta de envio e a NF.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-400">Carregando catálogo...</p>}

      {!loading && products.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Shirt size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Catálogo vazio</h2>
          <p className="mt-1 text-sm text-slate-500">O administrador ainda não cadastrou produtos.</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Seleção de produto */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 font-bold text-slate-900">1. Escolha o produto</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedId(p.id)
                    setColor('')
                    setSize('')
                  }}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    selectedId === p.id ? 'border-indigo-500 bg-indigo-50/60' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <Shirt size={20} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">Custo: {formatBRL(p.base_cost)}</p>
                  </div>
                  {selectedId === p.id && <Check size={16} className="ml-auto shrink-0 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Detalhes do pedido */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 font-bold text-slate-900">2. Detalhes</h3>

            {!product ? (
              <p className="text-sm text-slate-400">Selecione um produto ao lado para continuar.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Cor</label>
                    <select value={color} onChange={(e) => setColor(e.target.value)} className={inputClass}>
                      <option value="">Selecione...</option>
                      {(product.colors || []).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Tamanho</label>
                    <select value={size} onChange={(e) => setSize(e.target.value)} className={inputClass}>
                      <option value="">Selecione...</option>
                      {(product.sizes || []).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Quantidade</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
                      aria-label="Diminuir"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center text-lg font-bold text-slate-900">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
                      aria-label="Aumentar"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Custo por peça</span>
                    <span className="font-semibold text-slate-800">{formatBRL(product.base_cost)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-slate-600">Quantidade</span>
                    <span className="font-semibold text-slate-800">{qty}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                    <span className="font-semibold text-slate-700">Total a pagar à PlayDrop</span>
                    <span className="text-lg font-extrabold text-indigo-700">
                      {formatBRL(Number(product.base_cost || 0) * qty)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={createOrder}
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  <ShoppingCart size={16} />
                  {submitting ? 'Criando pedido...' : 'Finalizar pedido e anexar etiqueta'}
                  <ArrowRight size={16} />
                </button>
                <p className="text-center text-xs text-slate-400">
                  Após finalizar, você anexa a etiqueta de envio e a NF deste pedido.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NovoPedidoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Carregando...</p>}>
      <NovoPedidoContent />
    </Suspense>
  )
}
