'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Search, Shirt, TrendingUp, MessageCircle, Sparkles, X } from 'lucide-react'

function formatBRL(v) {
  if (v == null) return '—'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CatalogoPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('todas')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('id, name, category, description, base_cost, suggested_price, image_url, colors, sizes')
        .eq('exibir_landing', true)
        .eq('active', true)
        .order('name')
      setProducts(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const categorias = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products]
  )

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase()
    return products.filter((p) => {
      if (cat !== 'todas' && (p.category || '') !== cat) return false
      if (t && !(p.name || '').toLowerCase().includes(t) && !(p.category || '').toLowerCase().includes(t)) return false
      return true
    })
  }, [products, search, cat])

  const maiorMargem = useMemo(() => {
    return products.reduce((max, p) => {
      if (p.suggested_price == null || p.base_cost == null) return max
      const m = Number(p.suggested_price) - Number(p.base_cost)
      return m > max ? m : max
    }, 0)
  }, [products])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ===== HEADER FIXO ===== */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-playdrop.png" alt="PlayDrop" className="h-9 w-auto" />
          <a
            href="https://wa.me/5516994174280"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white transition hover:bg-emerald-400"
          >
            <MessageCircle size={16} />
            <span className="hidden sm:inline">Pedir pelo WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        </div>
      </nav>

      {/* ===== INTRO ===== */}
      <header className="mx-auto max-w-6xl px-4 pb-2 pt-8 text-center">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Catálogo PlayDrop</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          Camisetas prontas para revenda — você escolhe, anuncia com o seu preço e lucra por peça.
        </p>
        {maiorMargem > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300">
            <Sparkles size={14} /> Lucro de até <strong className="text-sm">{formatBRL(maiorMargem)}</strong> por peça
          </div>
        )}
      </header>

      {/* ===== BUSCA + CATEGORIAS ===== */}
      <section className="mx-auto max-w-6xl px-4 pb-4 pt-6">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 focus-within:border-indigo-500/60">
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar modelo ou categoria..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Limpar busca" className="text-slate-500 transition hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>

        {categorias.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none]">
            <button
              onClick={() => setCat('todas')}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
                cat === 'todas' ? 'bg-indigo-600 text-white' : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-indigo-500/50'
              }`}
            >
              Todos
            </button>
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
                  cat === c ? 'bg-indigo-600 text-white' : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-indigo-500/50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {!loading && (
          <p className="mt-3 text-xs text-slate-500">
            {filtered.length} modelo(s) {cat !== 'todas' || search ? 'encontrado(s)' : 'disponível(is)'}
          </p>
        )}
      </section>

      {/* ===== GRID DO CATÁLOGO ===== */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                <div className="aspect-square w-full animate-pulse bg-slate-800/60" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-slate-800/60" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800/60" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-800 px-6 py-16 text-center text-slate-400">
            <Shirt size={32} className="mx-auto text-slate-600" />
            <p className="mt-4 font-semibold text-slate-300">Catálogo sendo atualizado</p>
            <p className="mt-1 text-sm">Novos modelos em breve. Fale com a gente pelo WhatsApp!</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-800 px-6 py-14 text-center text-slate-400">
            <Shirt size={28} className="mx-auto text-slate-600" />
            <p className="mt-4 font-semibold text-slate-300">Nenhum modelo encontrado</p>
            <button
              onClick={() => { setSearch(''); setCat('todas') }}
              className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Limpar busca e filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {filtered.map((p) => {
              const m =
                p.suggested_price != null && p.base_cost != null
                  ? Number(p.suggested_price) - Number(p.base_cost)
                  : null
              return (
                <article
                  key={p.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 transition hover:border-indigo-500/50"
                >
                  <div className="aspect-square w-full overflow-hidden bg-slate-800">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600">
                        <Shirt size={36} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    {p.category && (
                      <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-400 sm:text-xs">{p.category}</p>
                    )}
                    <h3 className="mt-0.5 text-sm font-bold leading-snug sm:text-base">{p.name}</h3>
                    {(p.colors?.length > 0 || p.sizes?.length > 0) && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        {p.colors?.length > 0 && `${p.colors.length} cores`}
                        {p.colors?.length > 0 && p.sizes?.length > 0 && ' · '}
                        {p.sizes?.length > 0 && `${p.sizes.length} tamanhos`}
                      </p>
                    )}
                    {m != null && m > 0 && (
                      <div className="mt-auto pt-2.5">
                        <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                            <TrendingUp size={11} /> LUCRO APROX.
                          </span>
                          <span className="text-sm font-extrabold text-emerald-400">{formatBRL(m)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-indigo-600">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <h2 className="text-2xl font-extrabold">Gostou de algum modelo?</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-indigo-100">
            Fale com a gente pelo WhatsApp e comece a revender ainda esta semana.
          </p>
          <a
            href="https://wa.me/5516994174280"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-7 font-bold text-indigo-700 transition hover:bg-indigo-50"
          >
            <MessageCircle size={18} /> Falar no WhatsApp
          </a>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-playdrop.png" alt="PlayDrop" className="mx-auto h-9 w-auto" />
          <p className="mt-3 text-xs text-slate-500">PlayDrop by Korvo Ecossistema · © 2026</p>
          <p className="mt-1 text-[11px] text-slate-600">
            Valores de lucro aproximados. Pedidos e preços de revenda na plataforma.
          </p>
        </div>
      </footer>
    </div>
  )
}
