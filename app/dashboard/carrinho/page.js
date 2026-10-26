'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL } from '@/lib/utils'
import { Shirt, Trash2, Minus, Plus, ArrowRight, ShoppingBag, ArrowLeft, Check } from 'lucide-react'

export default function CarrinhoPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const { data } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')
    setItems(data ?? [])
    setLoading(false)
  }

  async function updateQty(item, delta) {
    const newQty = Math.max(1, Number(item.quantity || 1) + delta)
    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', item.id)
    load()
  }

  async function removeItem(id) {
    await supabase.from('cart_items').delete().eq('id', id)
    load()
  }

  const total = items.reduce((s, i) => s + Number(i.unit_cost || 0) * Number(i.quantity || 1), 0)
  const totalPecas = items.reduce((s, i) => s + Number(i.quantity || 1), 0)

  async function finalizar() {
    if (items.length === 0) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const totalCost = items.reduce((s, i) => s + Number(i.unit_cost || 0) * Number(i.quantity || 1), 0)

    // Cria o pedido
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        selling_price: totalCost,
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

    // Insere os itens do pedido
    const orderItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.product_name,
      color: i.color,
      size: i.size,
      quantity: i.quantity,
      unit_price: Number(i.unit_cost || 0),
    }))
    await supabase.from('order_items').insert(orderItems)

    // Limpa o carrinho
    const ids = items.map((i) => i.id)
    await supabase.from('cart_items').delete().in('id', ids)

    router.push(`/dashboard/pedido/${order.id}`)
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/catalogo"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
          >
            <ArrowLeft size={15} /> Continuar comprando
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-slate-900">
            <ShoppingBag size={22} className="text-indigo-600" /> Meu carrinho
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Revise seus itens e finalize a compra. Depois anexe a etiqueta e a NF.
          </p>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Carregando carrinho...</p>}

      {!loading && items.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ShoppingBag size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Seu carrinho está vazio</h2>
          <p className="mt-1 text-sm text-slate-500">
            Adicione camisetas do catálogo para começar seu pedido.
          </p>
          <Link
            href="/dashboard/catalogo"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Ver catálogo <ArrowRight size={15} />
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Itens */}
          <div className="space-y-3 lg:col-span-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt={item.product_name} className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <Shirt size={24} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{item.product_name}</p>
                  <p className="text-xs text-slate-500">
                    {item.color} · {item.size}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-indigo-700">
                    {formatBRL(Number(item.unit_cost || 0) * Number(item.quantity || 1))}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item, -1)}
                    className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"
                    aria-label="Diminuir"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-bold text-slate-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item, 1)}
                    className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"
                    aria-label="Aumentar"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="rounded-lg border border-slate-200 p-2 text-red-500 transition hover:bg-red-50"
                  aria-label="Remover"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Resumo */}
          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 font-bold text-slate-900">Resumo do pedido</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Itens</span>
                <span className="font-semibold text-slate-800">{totalPecas} peça(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Custo por peça</span>
                <span className="font-semibold text-slate-800">variável</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="font-semibold text-slate-700">Total a pagar à PlayDrop</span>
                <span className="text-lg font-extrabold text-indigo-700">{formatBRL(total)}</span>
              </div>
            </div>

            <button
              onClick={finalizar}
              disabled={submitting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
                            {submitting && <Check size={16} />}
              {!submitting && <ArrowRight size={16} />}
              <span>{submitting ? 'Criando pedido...' : 'Finalizar compra'}</span>
            </button>

            <p className="mt-3 text-center text-xs text-slate-400">
              Após finalizar, você anexa a etiqueta de envio e a NF deste pedido.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
