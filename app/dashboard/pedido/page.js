'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL } from '@/lib/utils'
import { ShoppingCart, Plus, Trash2, PackageCheck } from 'lucide-react'

export default function PedidoPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedId, setSelectedId] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [unitPrice, setUnitPrice] = useState('')

  const [items, setItems] = useState([])

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successOrder, setSuccessOrder] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name')
    setProducts(data ?? [])

    // Se veio do catálogo (?produto=ID), já pré-seleciona
    const params = new URLSearchParams(window.location.search)
    const pid = params.get('produto')
    if (pid) {
      const prod = (data ?? []).find((p) => p.id === pid)
      if (prod) {
        setSelectedId(pid)
        setUnitPrice(prod.suggested_price ?? prod.base_cost ?? '')
      }
    }
    setLoading(false)
  }

  const selected = products.find((p) => p.id === selectedId)

  function selectProduct(id) {
    setSelectedId(id)
    setColor('')
    setSize('')
    setQty(1)
    const prod = products.find((p) => p.id === id)
    setUnitPrice(prod?.suggested_price ?? prod?.base_cost ?? '')
  }

  function addItem() {
    setError('')
    if (!selected) return setError('Escolha um produto do catálogo.')
    if (!color) return setError('Informe a cor.')
    if (!size) return setError('Informe o tamanho.')
    if (!qty || qty < 1) return setError('Informe a quantidade.')

    const price = Number(unitPrice || selected.base_cost)
    setItems((prev) => [
      ...prev,
      {
        product_id: selected.id,
        product_name: selected.name,
        color,
        size,
        quantity: Number(qty),
        unit_cost: Number(selected.base_cost || 0),
        unit_price: price,
      },
    ])
    setColor('')
    setSize('')
    setQty(1)
    setUnitPrice('')
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const totalCost = items.reduce((s, i) => s + i.unit_cost * i.quantity, 0)
  const totalSelling = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const totalProfit = totalSelling - totalCost

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (items.length === 0) return setError('Adicione pelo menos um item ao pedido.')
    if (!customerName.trim()) return setError('Informe o nome do cliente final.')
    if (!customerAddress.trim()) return setError('Informe o endereço de entrega do cliente.')

    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Sessão expirada. Entre novamente.')
      setSubmitting(false)
      return
    }

    const orderNumber = 'PD-' + Math.random().toString(36).slice(2, 8).toUpperCase()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: 'novo',
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        customer_address: customerAddress.trim(),
        total_cost: totalCost,
        selling_price: totalSelling,
        notes: notes.trim() || null,
      })
      .select()
      .single()

    if (orderError) {
      setError('Não foi possível salvar o pedido. Tente novamente.')
      setSubmitting(false)
      return
    }

    const rows = items.map((i) => ({ ...i, order_id: order.id }))
    const { error: itemsError } = await supabase.from('order_items').insert(rows)

    if (itemsError) {
      setError('O pedido foi criado, mas houve um erro ao salvar os itens. Fale com o suporte.')
      setSubmitting(false)
      return
    }

    setSuccessOrder({ ...order, items })
    setSubmitting(false)
  }

  function reset() {
    setItems([])
    setCustomerName('')
    setCustomerPhone('')
    setCustomerAddress('')
    setNotes('')
    setSelectedId('')
    setColor('')
    setSize('')
    setQty(1)
    setUnitPrice('')
    setSuccessOrder(null)
    setError('')
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700'

  // ============ SUCESSO ============
  if (successOrder) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <PackageCheck size={32} />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Pedido criado!</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pedido <b className="text-indigo-600">{successOrder.order_number}</b> registrado com sucesso.
            A PlayDrop já recebeu e vai produzir a estampa DTF e enviar direto ao seu cliente.
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left text-sm">
            {successOrder.items.map((i, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-slate-200 py-2 last:border-0">
                <span className="font-medium text-slate-800">
                  {i.quantity}x {i.product_name}
                  <span className="text-slate-400"> · {i.color} · {i.size}</span>
                </span>
                <span className="font-semibold">{formatBRL(i.unit_price * i.quantity)}</span>
              </div>
            ))}
            <div className="mt-2 space-y-1 pt-2">
              <p className="flex justify-between">
                <span className="text-slate-500">Valor que você paga à PlayDrop</span>
                <b>{formatBRL(successOrder.total_cost)}</b>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Valor que você vendeu</span>
                <b>{formatBRL(successOrder.selling_price)}</b>
              </p>
              <p className="flex justify-between text-emerald-600">
                <span>Seu lucro neste pedido</span>
                <b>{formatBRL(Number(successOrder.selling_price) - Number(successOrder.total_cost))}</b>
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={reset}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Fazer outro pedido
            </button>
            <Link
              href="/dashboard/vendas"
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Ver minhas vendas
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ============ FORMULÁRIO ============
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Fazer pedido</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monte o pedido da venda que você fez. A PlayDrop estampa, embala e envia direto ao seu cliente final.
        </p>
      </div>

      {/* 1) Escolha do produto */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">1</span>
          Escolha o produto
        </h2>

        {loading ? (
          <p className="text-sm text-slate-400">Carregando catálogo...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-slate-500">
            O catálogo ainda está vazio. O administrador precisa cadastrar produtos primeiro.
          </p>
        ) : (
          <>
            <select
              value={selectedId}
              onChange={(e) => selectProduct(e.target.value)}
              className={inputClass}
            >
              <option value="">Selecione uma camiseta...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — custo {formatBRL(p.base_cost)}
                </option>
              ))}
            </select>

            {selected && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Cor</label>
                    {selected.colors?.length ? (
                      <select value={color} onChange={(e) => setColor(e.target.value)} className={inputClass}>
                        <option value="">Selecione a cor</option>
                        {selected.colors.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="Ex.: Preta"
                        className={inputClass}
                      />
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Tamanho</label>
                    {selected.sizes?.length ? (
                      <select value={size} onChange={(e) => setSize(e.target.value)} className={inputClass}>
                        <option value="">Selecione o tamanho</option>
                        {selected.sizes.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        placeholder="Ex.: M"
                        className={inputClass}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Seu preço de venda (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder={String(selected.base_cost)}
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      Custo da peça (pago à PlayDrop): {formatBRL(selected.base_cost)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={addItem}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Plus size={16} /> Adicionar ao pedido
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 2) Itens */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">2</span>
          Itens do pedido
        </h2>

        {items.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum item adicionado ainda.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((i, idx) => (
              <div key={idx} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {i.quantity}x {i.product_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {i.color} · {i.size} · custo {formatBRL(i.unit_cost)} · venda {formatBRL(i.unit_price)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-emerald-600">{formatBRL(i.unit_price * i.quantity)}</p>
                  <button
                    onClick={() => removeItem(idx)}
                    className="rounded-lg border border-slate-200 p-2 text-red-500 transition hover:bg-red-50"
                    aria-label="Remover item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
          <p className="flex justify-between">
            <span className="text-slate-500">Custo das peças (você paga à PlayDrop)</span>
            <b className="text-slate-900">{formatBRL(totalCost)}</b>
          </p>
          <p className="flex justify-between">
            <span className="text-slate-500">Valor total que você vendeu</span>
            <b className="text-slate-900">{formatBRL(totalSelling)}</b>
          </p>
          <p className="flex justify-between text-emerald-600">
            <span>Seu lucro previsto</span>
            <b>{formatBRL(totalProfit)}</b>
          </p>
        </div>
      </div>

      {/* 3) Cliente final */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">3</span>
          Dados do cliente final
        </h2>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelClass}>Nome do cliente *</label>
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nome de quem vai receber"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Telefone / WhatsApp</label>
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Endereço completo de entrega *</label>
            <textarea
              required
              rows={3}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Rua, número, bairro, cidade, UF, CEP"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Observações (opcional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: ponto de referência, brinde, recado..."
              className={inputClass}
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <ShoppingCart size={16} />
            {submitting ? 'Salvando pedido...' : 'Confirmar pedido'}
          </button>
        </form>
      </div>
    </div>
  )
}
