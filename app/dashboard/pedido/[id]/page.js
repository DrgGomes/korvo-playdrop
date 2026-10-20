'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL, formatDate, orderStatusLabel, orderStatusColor } from '@/lib/utils'
import {
  ArrowLeft, Printer, Download, Upload, FileText, Package,
  Truck, CheckCircle, XCircle, Clock, User, MapPin, Phone,
  Hash, Barcode, Camera, FileSpreadsheet, Image, Trash2, MessageCircle
} from 'lucide-react'

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const printRef = useRef()

  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [attachments, setAttachments] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    setProfile(p)

    const { data: o } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()
    if (!o) return router.push('/dashboard/vendas')
    setOrder(o)

    const { data: it } = await supabase.from('order_items').select('*').eq('order_id', id)
    setItems(it ?? [])

    const { data: att } = await supabase.from('order_attachments').select('*').eq('order_id', id).order('created_at')
    setAttachments(att ?? [])

    setLoading(false)
  }

  const isAdmin = profile?.role === 'admin'

  const statusFlow = ['novo', 'em_producao', 'em_separacao', 'separado', 'enviado', 'entregue']
  const currentIdx = statusFlow.indexOf(order?.status)

  async function updateStatus(newStatus) {
    setUpdating(true)
    await supabase.from('orders').update({ status: newStatus }).eq('id', id)
    await supabase.from('activities').insert({
      user_id: order.user_id,
      order_id: id,
      action: `Status alterado para: ${orderStatusLabel(newStatus)}`,
      created_at: new Date().toISOString(),
    })
    setUpdating(false)
    load()
  }

  async function uploadFile(type) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = type === 'etiqueta' ? '.pdf,.png,.jpg,.jpeg' : '.pdf,.xml,.png,.jpg,.jpeg'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      setUploading(true)

      const ext = file.name.split('.').pop()
      const filename = `${id}/${type}_${Date.now()}.${ext}`

      const { data: upload, error: uploadError } = await supabase.storage
        .from('order-files')
        .upload(filename, file)

      if (uploadError) {
        alert('Erro ao enviar arquivo. Tente novamente.')
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('order-files')
        .getPublicUrl(filename)

      await supabase.from('order_attachments').insert({
        order_id: id,
        type,
        file_url: publicUrl,
        filename: file.name,
      })

      setUploading(false)
      load()
    }
    input.click()
  }

  async function removeAttachment(attId) {
    await supabase.from('order_attachments').delete().eq('id', attId)
    load()
  }

    function handlePrint() {
    window.print()
  }

  // Compartilha o pedido no WhatsApp como cupom de confirmação
  function compartilharWhatsApp() {
    if (!order) return
    const linhas = []
    linhas.push('*PLAYDROP — CONFIRMAÇÃO DE PEDIDO*')
    linhas.push('')
    linhas.push(`*Pedido nº:* #${order.order_number || order.id.slice(0, 8)}`)
    linhas.push(`*Data:* ${formatDate(order.created_at)}`)
    linhas.push(`*Cliente:* ${order.customer_name || profile?.name || '—'}`)
    linhas.push('')
    linhas.push('--------------------------')
    linhas.push('*ITENS DO PEDIDO*')
    linhas.push('--------------------------')
    items.forEach((i) => {
      linhas.push(`${i.quantity}x ${i.product_name}`)
      if (i.size) linhas.push(`Tamanho: ${i.size}`)
      if (i.color) linhas.push(`Cor: ${i.color}`)
      linhas.push(formatBRL(Number(i.unit_price || 0) * Number(i.quantity || 1)))
      linhas.push('')
    })
    linhas.push('--------------------------')
    linhas.push(`*TOTAL: ${formatBRL(Number(order.selling_price || 0))}*`)
    linhas.push('--------------------------')
    linhas.push('')
    linhas.push('Favor confirmar o recebimento deste pedido para separação.')
    const texto = encodeURIComponent(linhas.join('\n'))
    window.open('https://wa.me/?text=' + texto, '_blank')
  }

  // Gera um código de barras numérico a partir do ID do pedido
  const barcodeNumber = useMemo(() => {
    if (!order?.id) return '000000000000'
    const hash = order.id.replace(/-/g, '').slice(0, 12)
    return hash.padEnd(12, '0')
  }, [order])

  // URL do pedido para o QR code
  const orderUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/dashboard/pedido/${id}`
  }, [id])

  // Timeline de status
  const timeline = useMemo(() => {
    return statusFlow.map((s, idx) => ({
      status: s,
      label: orderStatusLabel(s),
      active: idx <= currentIdx,
      current: idx === currentIdx,
      done: idx < currentIdx,
    }))
  }, [currentIdx])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-400">Carregando pedido...</p>
      </div>
    )
  }

  if (!order) return null

  const totalItems = items.reduce((s, i) => s + Number(i.quantity || 0), 0)
  const totalValue = items.reduce((s, i) => s + Number(i.unit_price || 0) * Number(i.quantity || 0), 0)
  const profit = Number(order.selling_price || 0) - Number(order.total_cost || 0)

  return (
    <>
      {/* CSS de impressão */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 80mm; padding: 4mm; font-size: 10px; }
          .no-print { display: none !important; }
          @page { margin: 0; size: 80mm auto; }
        }
      `}</style>

      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard/vendas"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
            >
              <ArrowLeft size={15} /> Voltar às vendas
            </Link>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
              Pedido {order.order_number || order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-slate-500">
              Criado em {formatDate(order.created_at)} · {totalItems} peça(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Printer size={15} /> Imprimir cupom
            </button>
          </div>
        </div>

        {/* Status atual + timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Status atual</p>
              <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${orderStatusColor(order.status)}`}>
                {orderStatusLabel(order.status)}
              </span>
            </div>
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                {statusFlow.map((s) => {
                  const idx = statusFlow.indexOf(s)
                  if (idx <= currentIdx + 1 && idx >= currentIdx - 1 && s !== order.status) {
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(s)}
                        disabled={updating}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                          idx > currentIdx
                            ? 'border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {idx > currentIdx ? `Avançar: ${orderStatusLabel(s)}` : orderStatusLabel(s)}
                      </button>
                    )
                  }
                  return null
                })}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="mt-6 flex items-center gap-1 overflow-x-auto pb-2">
            {timeline.map((t, idx) => (
              <div key={t.status} className="flex items-center gap-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    t.done
                      ? 'bg-emerald-100 text-emerald-700'
                      : t.current
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {t.done ? '✓' : t.current ? '●' : '○'}
                </div>
                <span
                  className={`whitespace-nowrap text-xs font-medium ${
                    t.current ? 'font-bold text-indigo-700' : t.done ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {t.label}
                </span>
                {idx < timeline.length - 1 && (
                  <div className={`mx-1 h-0.5 w-6 ${t.done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Grid: Cliente + Itens + Financeiro */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cliente */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 font-bold text-slate-900">
              <User size={16} className="text-indigo-600" /> Cliente final
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-semibold text-slate-800">{order.customer_name || '—'}</p>
              {order.customer_phone && (
                <p className="flex items-center gap-1.5 text-slate-600">
                  <Phone size={13} /> {order.customer_phone}
                </p>
              )}
              {order.customer_address && (
                <p className="flex items-start gap-1.5 text-slate-600">
                  <MapPin size={13} className="mt-0.5 shrink-0" /> {order.customer_address}
                </p>
              )}
              {order.customer_city && (
                <p className="text-slate-500">
                  {order.customer_city}{order.customer_state ? ` - ${order.customer_state}` : ''}
                </p>
              )}
              {order.customer_zip && <p className="text-slate-500">CEP: {order.customer_zip}</p>}
            </div>
          </div>

          {/* Itens */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
            <h3 className="flex items-center gap-2 font-bold text-slate-900">
              <Package size={16} className="text-indigo-600" /> Itens do pedido
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-3">Produto</th>
                    <th className="py-2 pr-3">Cor</th>
                    <th className="py-2 pr-3">Tam</th>
                    <th className="py-2 pr-3 text-right">Qtd</th>
                    <th className="py-2 pr-3 text-right">Preço</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-3 font-medium text-slate-900">{i.product_name}</td>
                      <td className="py-2 pr-3 text-slate-500">{i.color || '—'}</td>
                      <td className="py-2 pr-3 text-slate-500">{i.size || '—'}</td>
                      <td className="py-2 pr-3 text-right">{i.quantity}</td>
                      <td className="py-2 pr-3 text-right">{formatBRL(i.unit_price)}</td>
                      <td className="py-2 text-right font-semibold">
                        {formatBRL(Number(i.unit_price || 0) * Number(i.quantity || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Valor total dos itens</span>
                <span className="font-semibold text-slate-900">{formatBRL(totalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Custo (pago à PlayDrop)</span>
                <span className="text-slate-700">{formatBRL(order.total_cost)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1">
                <span className="font-semibold text-slate-700">Lucro do revendedor</span>
                <span className={`font-extrabold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatBRL(profit)}
                </span>
              </div>
              <div className="flex justify-between text-base">
                <span className="font-bold text-slate-800">Preço de venda</span>
                <span className="font-extrabold text-indigo-700">{formatBRL(order.selling_price)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Anexos: Etiqueta e NF */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <FileText size={16} className="text-indigo-600" /> Etiqueta de envio e Nota Fiscal
          </h3>
          <p className="mb-4 text-sm text-slate-500">
            Anexe a etiqueta de envio e a NF deste pedido. Cada arquivo fica vinculado apenas a este pedido.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => uploadFile('etiqueta')}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <Upload size={15} /> {uploading ? 'Enviando...' : 'Anexar etiqueta'}
            </button>
            <button
              onClick={() => uploadFile('nf')}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <Upload size={15} /> {uploading ? 'Enviando...' : 'Anexar NF'}
            </button>
          </div>

          {attachments.length > 0 && (
            <div className="mt-4 divide-y divide-slate-100">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-3 py-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    att.type === 'etiqueta' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {att.type === 'etiqueta' ? <Truck size={18} /> : <FileText size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {att.type === 'etiqueta' ? 'Etiqueta' : 'Nota Fiscal'}
                    </p>
                    <p className="truncate text-xs text-slate-400">{att.filename || att.file_url?.split('/').pop()}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                      aria-label="Download"
                    >
                      <Download size={15} />
                    </a>
                    {isAdmin && (
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="rounded-lg border border-slate-200 p-2 text-red-500 transition hover:bg-red-50"
                        aria-label="Remover"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {attachments.length === 0 && (
            <p className="mt-3 text-sm text-slate-400">
              Nenhum arquivo anexado ainda. Anexe a etiqueta de envio e a NF para liberar o pedido para envio.
            </p>
          )}
        </div>

        {/* Observações */}
        {order.notes && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">Observações</h3>
            <p className="mt-2 text-sm text-slate-600">{order.notes}</p>
          </div>
        )}
      </div>

      {/* ===== ÁREA DE IMPRESSÃO (cupom térmico 80mm) ===== */}
      <div id="print-area" ref={printRef} className="hidden print:block">
        <div style={{ fontFamily: 'monospace', fontSize: '10px', lineHeight: '1.3' }}>
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <strong style={{ fontSize: '14px' }}>PLAYDROP</strong><br />
            by Korvo Ecossistema
          </div>

          <div style={{ textAlign: 'center', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', marginBottom: '6px' }}>
            <strong style={{ fontSize: '16px' }}>#{order.order_number || order.id.slice(0, 8)}</strong>
          </div>

          <div style={{ marginBottom: '6px' }}>
            <strong>Status:</strong> {orderStatusLabel(order.status)}<br />
            <strong>Data:</strong> {formatDate(order.created_at)}<br />
            <strong>Cliente:</strong> {order.customer_name || '—'}<br />
            {order.customer_phone && <><strong>Tel:</strong> {order.customer_phone}<br /></>}
            {order.customer_address && <><strong>End:</strong> {order.customer_address}<br /></>}
            {order.customer_city && <><strong>Cidade:</strong> {order.customer_city}{order.customer_state ? ` - ${order.customer_state}` : ''}<br /></>}
          </div>

          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', marginBottom: '6px' }}>
            {items.map((i, idx) => (
              <div key={i.id} style={{ marginBottom: '2px' }}>
                <strong>{i.product_name}</strong><br />
                {i.color && i.size ? `${i.color} / ${i.size}` : i.color || i.size || ''} · Qtd: {i.quantity} · R$ {Number(i.unit_price || 0).toFixed(2)}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '6px' }}>
            <strong>Total itens:</strong> R$ {totalValue.toFixed(2)}<br />
            <strong>Custo:</strong> R$ {Number(order.total_cost || 0).toFixed(2)}<br />
            <strong style={{ fontSize: '12px' }}>Preço de venda: R$ {Number(order.selling_price || 0).toFixed(2)}</strong>
          </div>

          {/* Código de barras (representação visual) */}
          <div style={{ textAlign: 'center', marginBottom: '6px', padding: '4px 0', borderTop: '1px dashed #000' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '24px', letterSpacing: '2px', fontWeight: 'bold' }}>
              ||||||||||||||||||||
            </div>
            <div style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: 'bold' }}>
              {barcodeNumber}
            </div>
          </div>

          {/* QR Code via API */}
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(orderUrl)}`}
              alt="QR Code"
              style={{ width: '80px', height: '80px', margin: '0 auto' }}
            />
            <div style={{ fontSize: '8px', marginTop: '2px' }}>Aponte para dar baixa</div>
          </div>

          <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '4px', fontSize: '8px' }}>
            PlayDrop by Korvo Ecossistema<br />
            {formatDate(new Date())}
          </div>
        </div>
      </div>
    </>
  )
}
