'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/utils'
import {
  Megaphone, ImageIcon, Plus, Trash2, Check, X, Upload, Info, Tag, AlertTriangle,
} from 'lucide-react'

const TYPE_META = {
  info: { label: 'Informativo', icon: Info, chip: 'bg-blue-50 text-blue-700' },
  promo: { label: 'Promoção', icon: Tag, chip: 'bg-emerald-50 text-emerald-700' },
  alerta: { label: 'Alerta', icon: AlertTriangle, chip: 'bg-amber-50 text-amber-700' },
}

export default function AdminAvisosPage() {
  const [notices, setNotices] = useState([])
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  // Formulário de aviso
  const [nTitle, setNTitle] = useState('')
  const [nMessage, setNMessage] = useState('')
  const [nType, setNType] = useState('info')
  const [savingNotice, setSavingNotice] = useState(false)

  // Formulário de banner
  const [bSlot, setBSlot] = useState('dashboard')
  const [bTitle, setBTitle] = useState('')
  const [bLink, setBLink] = useState('')
  const [bImage, setBImage] = useState(null)
  const [savingBanner, setSavingBanner] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [{ data: n }, { data: b }] = await Promise.all([
      supabase.from('notices').select('*').order('created_at', { ascending: false }),
      supabase.from('banners').select('*').order('created_at', { ascending: false }),
    ])
    setNotices(n ?? [])
    setBanners(b ?? [])
    setLoading(false)
  }

  async function saveNotice() {
    if (!nTitle.trim() || !nMessage.trim()) {
      alert('Preencha o título e a mensagem do aviso.')
      return
    }
    setSavingNotice(true)
    const { error } = await supabase.from('notices').insert({
      title: nTitle.trim(),
      message: nMessage.trim(),
      type: nType,
      active: true,
    })
    setSavingNotice(false)

    if (error) {
      alert('Erro ao publicar o aviso: ' + error.message)
      return
    }

    setNTitle('')
    setNMessage('')
    setNType('info')
    load()
  }

  async function toggleNotice(n) {
    await supabase.from('notices').update({ active: !n.active }).eq('id', n.id)
    load()
  }

  async function deleteNotice(id) {
    if (!confirm('Apagar este aviso?')) return
    await supabase.from('notices').delete().eq('id', id)
    load()
  }

  async function uploadBannerImage(file) {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('banners')
      .upload(path, file, { contentType: file.type })
    if (error) {
      alert('Erro ao enviar a imagem: ' + error.message)
      return null
    }
    const { data } = supabase.storage.from('banners').getPublicUrl(path)
    return data.publicUrl
  }

  async function saveBanner() {
    if (!bImage) {
      alert('Escolha uma imagem para o banner.')
      return
    }
    setSavingBanner(true)
    const url = await uploadBannerImage(bImage)
    if (url) {
      await supabase.from('banners').insert({
        slot: bSlot,
        title: bTitle.trim() || null,
        image_url: url,
        link_url: bLink.trim() || null,
        active: true,
      })
      setBTitle('')
      setBLink('')
      setBImage(null)
      load()
    }
    setSavingBanner(false)
  }

  async function toggleBanner(b) {
    await supabase.from('banners').update({ active: !b.active }).eq('id', b.id)
    load()
  }

  async function deleteBanner(id) {
    if (!confirm('Apagar este banner?')) return
    await supabase.from('banners').delete().eq('id', id)
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Avisos & Banners</h1>
        <p className="mt-1 text-sm text-slate-500">
          Crie avisos (aparecem no sininho do cliente) e banners (dashboard e sidebar).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ===== NOVO AVISO ===== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <Megaphone size={18} className="text-indigo-600" /> Novo aviso
          </h3>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">Título</label>
              <input
                value={nTitle}
                onChange={(e) => setNTitle(e.target.value)}
                placeholder="Ex.: Nova coleção disponível!"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Mensagem</label>
              <textarea
                value={nMessage}
                onChange={(e) => setNMessage(e.target.value)}
                rows={3}
                placeholder="Escreva a mensagem que o revendedor vai ler no sininho..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Tipo</label>
              <div className="mt-1 flex gap-2">
                {Object.entries(TYPE_META).map(([key, meta]) => {
                  const Icon = meta.icon
                  return (
                    <button
                      key={key}
                      onClick={() => setNType(key)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        nType === key
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={13} /> {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              onClick={saveNotice}
              disabled={savingNotice}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingNotice ? <Check size={16} /> : <Plus size={16} />}
              {savingNotice ? 'Publicando...' : 'Publicar aviso'}
            </button>
          </div>
        </div>

        {/* ===== NOVO BANNER ===== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <ImageIcon size={18} className="text-indigo-600" /> Novo banner
          </h3>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">Onde aparece</label>
              <div className="mt-1 flex gap-2">
                {[
                  { v: 'dashboard', l: 'Dashboard (topo)' },
                  { v: 'sidebar', l: 'Sidebar (218×144)' },
                ].map((s) => (
                  <button
                    key={s.v}
                    onClick={() => setBSlot(s.v)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      bSlot === s.v
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Título (opcional)</label>
              <input
                value={bTitle}
                onChange={(e) => setBTitle(e.target.value)}
                placeholder="Ex.: Frete grátis acima de 10 peças"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Link ao clicar (opcional)</label>
              <input
                value={bLink}
                onChange={(e) => setBLink(e.target.value)}
                placeholder="Ex.: /dashboard/catalogo"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Imagem</label>
              <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-3 py-6 text-sm font-medium text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600">
                <Upload size={16} />
                {bImage ? bImage.name : 'Clique para escolher a imagem'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setBImage(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <button
              onClick={saveBanner}
              disabled={savingBanner}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingBanner ? <Check size={16} /> : <Plus size={16} />}
              {savingBanner ? 'Enviando...' : 'Publicar banner'}
            </button>
          </div>
        </div>
      </div>

      {/* ===== LISTA DE AVISOS ===== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">Avisos publicados</h3>
        {loading ? (
          <p className="mt-3 text-sm text-slate-400">Carregando...</p>
        ) : notices.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Nenhum aviso ainda.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {notices.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.info
              const Icon = meta.icon
              return (
                <div key={n.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.chip}`}>
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-slate-500">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(n.created_at)}</p>
                  </div>
                  <button
                    onClick={() => toggleNotice(n)}
                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      n.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {n.active ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    onClick={() => deleteNotice(n.id)}
                    className="shrink-0 rounded-lg border border-slate-200 p-2 text-red-500 transition hover:bg-red-50"
                    aria-label="Apagar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ===== LISTA DE BANNERS ===== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">Banners publicados</h3>
        {loading ? (
          <p className="mt-3 text-sm text-slate-400">Carregando...</p>
        ) : banners.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Nenhum banner ainda.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((b) => (
              <div key={b.id} className="overflow-hidden rounded-xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image_url} alt={b.title || 'Banner'} className="h-32 w-full object-cover" />
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-slate-900">{b.title || 'Sem título'}</p>
                  <p className="text-xs text-slate-400">
                    {b.slot === 'sidebar' ? 'Sidebar' : 'Dashboard'}
                    {b.link_url ? ` · ${b.link_url}` : ''}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => toggleBanner(b)}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                        b.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {b.active ? 'Ativo' : 'Inativo'}
                    </button>
                    <button
                      onClick={() => deleteBanner(b.id)}
                      className="rounded-lg border border-slate-200 p-1.5 text-red-500 transition hover:bg-red-50"
                      aria-label="Apagar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
