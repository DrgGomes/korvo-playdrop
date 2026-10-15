'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL, formatDate } from '@/lib/utils'
import { BRAND } from '@/lib/brand'
import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'
import { Printer, ArrowLeft } from 'lucide-react'

export default function CupomPage() {
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [qrData, setQrData] = useState(null)
  const barRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) load(id)
    else setLoading(false)
  }, [])

  async function load(id) {
    const { data: o } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!o) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setOrder(o)

    const { data: its } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id)
    setItems(its ?? [])

    // QR code aponta para o link deste cupom
    QRCode.toDataURL(`${window.location.origin}/dashboard/admin/status?id=${id}`, {
      width: 220,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(setQrData)
      .catch(() => {})

    setLoading(false)
  }

  const number = order?.order_number || (order ? order.id.slice(0, 8).toUpperCase() : '')

  // Código de barras do número do pedido
  useEffect(() => {
    if (barRef.current && number) {
      try {
        JsBarcode(barRef.current, number, {
          format: 'CODE128',
          width: 1.6,
          height: 46,
          displayValue: false,
          margin: 0,
        })
      } catch {}
    }
  }, [number, order])

  const totalPecas = items.reduce((s, it) => s + Number(it.quantity || 1), 0)

  function goBack() {
    if (window.history.length > 1) window.history.back()
    else window.location.href = '/dashboard'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Carregando cupom...
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="font-bold text-slate-800">Pedido não encontrado</p>
        <p className="text-sm text-slate-500">O link pode estar errado ou o pedido não existe.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-200 py-8">
      {/* Impressão: sai SÓ o cupom, sem o resto da tela */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #cupom, #cupom * { visibility: visible !important; }
          #cupom {
            position: absolute;
            left: 50%;
            top: 0;
            transform: translateX(-50%);
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Botões (não saem na impressão) */}
      <div className="no-print mx-auto mb-4 flex w-[302px] gap-2">
        <button
          onClick={goBack}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <ArrowLeft size={15} /> Voltar
        </button>
        <button
          onClick={() => window.print()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Printer size={15} /> Imprimir
        </button>
      </div>

      {/* ===== CUPOM 80mm ===== */}
      <div
        id="cupom"
        className="mx-auto w-[302px] bg-white p-4 font-mono text-[11px] leading-relaxed text-black shadow-lg"
      >
        {/* Marca */}
        <div className="flex flex-col items-center text-center">
          {BRAND.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={BRAND.logoUrl} alt="PlayDrop" className="h-10 w-auto" />
          ) : (
            <p className="text-base font-extrabold tracking-wide">PLAYDROP</p>
          )}
          <p className="mt-1 text-[10px] text-black/70">by Korvo Ecossistema</p>
          <p className="mt-0.5 text-[10px] text-black/70">Comprovante de pedido — não é documento fiscal</p>
        </div>

        <div className="my-3 border-t border-dashed border-black/70" />

        {/* Número do pedido + código de barras */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-black/60">Pedido</p>
          <p className="text-xl font-extrabold tracking-wide">{number}</p>
          <svg ref={barRef} className="mx-auto mt-1 block" />
          <p className="mt-0.5 text-[9px] text-black/50">{number}</p>
        </div>

        <div className="my-3 border-t border-dashed border-black/70" />

        {/* Dados */}
        <div className="space-y-0.5">
          <p><b>Data:</b> {formatDate(order.created_at)}</p>
          <p><b>Cliente:</b> {order.customer_name || '—'}</p>
        </div>

        <div className="my-3 border-t border-dashed border-black/70" />

        {/* Itens */}
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-black/60">Itens</p>
        <div className="mt-1 space-y-1">
          {items.length === 0 ? (
            <p className="text-center text-black/50">Sem itens cadastrados.</p>
          ) : (
            items.map((it, i) => (
              <div key={it.id || i} className="flex justify-between gap-2">
                <span className="min-w-0 truncate">
                  {it.quantity ?? 1}x {it.product_name || it.name || 'Produto'}
                  {it.color ? ` · ${it.color}` : ''}
                  {it.size ? ` · ${it.size}` : ''}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="my-3 border-t border-dashed border-black/70" />

        {/* Totais */}
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span>Total de peças</span>
            <b>{totalPecas}</b>
          </div>
          <div className="flex justify-between text-sm">
            <b>Total do pedido</b>
            <b>{formatBRL(order.selling_price)}</b>
          </div>
        </div>

        <div className="my-3 border-t border-dashed border-black/70" />

        {/* QR code */}
        <div className="flex flex-col items-center">
          {qrData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrData} alt="QR Code do pedido" className="h-28 w-28" />
          ) : (
            <div className="h-28 w-28 animate-pulse rounded bg-black/10" />
          )}
          <p className="mt-1 text-center text-[9px] text-black/60">
            Aponte a câmera para consultar este pedido
          </p>
        </div>

        <div className="my-3 border-t border-dashed border-black/70" />

        {/* Rodapé */}
        <p className="text-center text-[10px] leading-snug text-black/70">
        </p>
        <p className="mt-1 text-center text-[9px] text-black/50">
          PlayDrop · by Korvo Ecossistema
        </p>
      </div>

      <p className="no-print mx-auto mt-3 w-[302px] text-center text-xs text-slate-500">
        Cupom em formato térmico 80mm — na impressão sai só o cupom, sem o resto da tela.
      </p>
    </div>
  )
}
