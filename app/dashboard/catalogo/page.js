'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL } from '@/lib/utils'
import {
  Search, Shirt, Copy, Check, ChevronLeft, ChevronRight,
  Wallet, X, Download, FileText, ShoppingCart, ClipboardList,
} from 'lucide-react'

// Regras da plataforma
const COMISSAO = 0.15   // 15%
const TAXA_FIXA = 4.00  // R$ 4,00

export default function CatalogoPage() {
  const [products, setProducts] = useState([])
  const [imagesByProduct, setImagesByProduct] = useState({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('todas')
  const [copied, setCopied] = useState(null)        // botão "copiar anúncio" do card
  const [copiedField, setCopiedField] = useState(null) // campo copiado no modal
  const [photoIndex, setPhotoIndex] = useState({})

  // Modal de material de divulgação
  const [selected, setSelected] = useState(null)
  const [modalPhoto, setModalPhoto] = useState(0)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name')
    const list = data ?? []
    setProducts(list)

    if (list.length > 0) {
      const ids = list.map((p) => p.id)
      const { data: imgs } = await supabase
        .from('product_images')
        .select('product_id, image_url, sort_order')
        .in('product_id', ids)
        .order('sort_order')

      const map = {}
      ;(imgs ?? []).forEach((img) => {
        if (!map[img.product_id]) map[img.product_id] = []
        map[img.product_id].push(img.image_url)
      })
      setImagesByProduct(map)
    }
    setLoading(false)
  }

  const categories = useMemo(
    () => ['todas', ...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  )

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const okQuery = !query || p.name?.toLowerCase().includes(query.toLowerCase())
        const okCat = category === 'todas' || p.category === category
        return okQuery && okCat
      }),
    [products, query, category]
  )

  // Lucro = preço sugerido - 15% - R$ 4,00 - custo da peça
  function profit(p) {
    const price = Number(p.suggested_price || 0)
    const cost = Number(p.base_cost || 0)
    return price - price * COMISSAO - TAXA_FIXA - cost
  }

  function suggestedTitle(p) {
    const colors = p.colors?.length ? p.colors.join(', ') : 'consulte as cores'
    return `${p.name} — Camiseta Estampada DTF Premium | ${colors}`
  }

  const fallbackDesc =
    'Camiseta 100% algodão com estampa DTF de alta durabilidade, toque macio e estampa que não desbota, não trinca e não sai na lavagem.'

  function makeAd(p) {
    const sizes = p.sizes?.length ? p.sizes.join(', ') : 'P ao GG'
    const colors = p.colors?.length ? p.colors.join(', ') : 'consulte as cores'
    const title = suggestedTitle(p)
    const desc = `${p.description || fallbackDesc}\n\n📏 Tamanhos: ${sizes}\n🎨 Cores: ${colors}\n\n✅ Envio rápido e protegido\n✅ Pagamento seguro (Pix / cartão)\n✅ Troca garantida em caso de defeito\n\nQualidade PlayDrop by Korvo Ecossistema.`
    return `${title}\n\n${desc}`
  }

  // Ficha técnica em texto (para copiar)
  function fichaText(p) {
    return [
      p.name,
      `Categoria: ${p.category || '—'}`,
      `Cores: ${p.colors?.join(', ') || '—'}`,
      `Tamanhos: ${p.sizes?.join(', ') || '—'}`,
      `Custo: R$ ${Number(p.base_cost || 0).toFixed(2)}`,
      `Preço de venda sugerido: R$ ${Number(p.suggested_price || 0).toFixed(2)}`,
      `Seu lucro estimado: R$ ${profit(p).toFixed(2)}`,
    ].join('\n')
  }

  async function copyText(text, field) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1800)
    } catch {}
  }

  async function copyAd(p) {
    try {
      await navigator.clipboard.writeText(makeAd(p))
      setCopied(p.id)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  function photosOf(p) {
    const imgs = imagesByProduct[p.id] || []
    return imgs.length > 0 ? imgs : p.image_url ? [p.image_url] : []
  }

  function openModal(p) {
    setSelected(p)
    setModalPhoto(0)
  }

  const CopyButton = ({ active, onClick, label, activeLabel }) => (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-emerald-600 text-white'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      {active ? <Check size={13} /> : <Copy size={13} />}
      {active ? activeLabel : label}
    </button>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Catálogo</h1>
        <p className="mt-1 text-sm text-slate-500">
          Clique em um produto para abrir o material de divulgação: título, ficha, descrição e fotos para baixar.
        </p>
      </div>

      {/* Busca e filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar camiseta..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                category === c ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {c === 'todas' ? 'Todas' : c}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Carregando catálogo...</p>}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Shirt size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            {products.length === 0 ? 'Catálogo ainda vazio' : 'Nenhuma camiseta encontrada'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {products.length === 0
              ? 'O administrador ainda não cadastrou produtos. Volte em breve!'
              : 'Tente buscar por outro nome ou categoria.'}
          </p>
        </div>
      )}

      {/* Grade de produtos */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((p) => {
          const photos = photosOf(p)
          const cur = photoIndex[p.id] || 0
          const lucro = profit(p)
          return (
            <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {/* Foto 250x250 — clica para abrir o material */}
              <button
                onClick={() => openModal(p)}
                className="relative flex h-[250px] w-[250px] items-center justify-center self-center bg-slate-100"
              >
                {photos.length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photos[cur]} alt={p.name} className="h-full w-full object-cover" />
                    {photos.length > 1 && (
                      <>
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            setPhotoIndex({ ...photoIndex, [p.id]: (cur - 1 + photos.length) % photos.length })
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition hover:bg-black/70"
                        >
                          <ChevronLeft size={16} />
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            setPhotoIndex({ ...photoIndex, [p.id]: (cur + 1) % photos.length })
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition hover:bg-black/70"
                        >
                          <ChevronRight size={16} />
                        </span>
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                          {cur + 1}/{photos.length}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <Shirt size={42} className="text-slate-300" />
                )}
              </button>

              <div className="flex flex-1 flex-col p-4">
                <button onClick={() => openModal(p)} className="text-left">
                  <h3 className="font-bold leading-snug text-slate-900 hover:text-indigo-600">{p.name}</h3>
                </button>
                {p.category && (
                  <span className="mt-1 w-fit rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                    {p.category}
                  </span>
                )}

                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  <p>
                    Custo: <span className="font-semibold text-slate-700">{formatBRL(p.base_cost)}</span>
                  </p>
                  <p>
                    Preço de venda sugerido:{' '}
                    <span className="font-semibold text-slate-700">{formatBRL(p.suggested_price)}</span>
                  </p>
                </div>

                <div className="mt-3 rounded-xl bg-emerald-50/70 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <Wallet size={14} /> Seu lucro estimado por peça
                  </div>
                  <p className="mt-1 text-xl font-extrabold text-emerald-700">{formatBRL(lucro)}</p>
                  <p className="mt-0.5 text-[11px] text-emerald-600/80">
                    Já descontados 15% de comissão + R$ 4,00 de taxa
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openModal(p)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <FileText size={14} /> Material
                  </button>
                  <Link
                    href={`/dashboard/pedido?produto=${p.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-2 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <ShoppingCart size={14} /> Fazer pedido
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ===== MODAL DE MATERIAL DE DIVULGAÇÃO ===== */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-600">
                  <ClipboardList size={12} /> Material de divulgação
                </span>
                <h2 className="mt-2 text-xl font-extrabold text-slate-900">{selected.name}</h2>
                {selected.category && (
                  <p className="mt-0.5 text-sm font-medium text-indigo-600">{selected.category}</p>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="shrink-0 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Foto pequena + downloads */}
            <div className="mt-5 flex flex-col items-center">
              <div className="relative h-52 w-52">
                {photosOf(selected).length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photosOf(selected)[modalPhoto]}
                      alt={selected.name}
                      className="h-full w-full rounded-2xl border border-slate-200 object-cover"
                    />
                    {photosOf(selected).length > 1 && (
                      <>
                        <button
                          onClick={() => setModalPhoto((modalPhoto - 1 + photosOf(selected).length) % photosOf(selected).length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                          aria-label="Anterior"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => setModalPhoto((modalPhoto + 1) % photosOf(selected).length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                          aria-label="Próxima"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                          {modalPhoto + 1}/{photosOf(selected).length}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                    <Shirt size={40} />
                  </div>
                )}
              </div>

              {/* Botões de download de cada foto */}
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {photosOf(selected).map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <Download size={13} /> Baixar foto {i + 1}
                  </a>
                ))}
              </div>
            </div>

            {/* Título sugerido */}
            <section className="mt-6">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Título sugerido</h3>
                <CopyButton
                  active={copiedField === 'titulo'}
                  onClick={() => copyText(suggestedTitle(selected), 'titulo')}
                  label="Copiar"
                  activeLabel="Copiado!"
                />
              </div>
              <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{suggestedTitle(selected)}</p>
            </section>

            {/* Ficha do produto / tabela */}
            <section className="mt-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Ficha do produto</h3>
                <CopyButton
                  active={copiedField === 'ficha'}
                  onClick={() => copyText(fichaText(selected), 'ficha')}
                  label="Copiar ficha"
                  activeLabel="Copiado!"
                />
              </div>

              <div className="mt-2 rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap gap-1.5">
                  {(selected.colors || []).map((c) => (
                    <span key={c} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {c}
                    </span>
                  ))}
                  {(selected.sizes || []).map((s) => (
                    <span key={s} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {s}
                    </span>
                  ))}
                </div>

                {Array.isArray(selected.medidas) && selected.medidas.length > 0 && (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                        <tr>
                          {Object.keys(selected.medidas[0]).map((k) => (
                            <th key={k} className="px-3 py-2">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.medidas.map((m, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            {Object.values(m).map((v, j) => (
                              <td key={j} className="px-3 py-2 text-slate-700">{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* Descrição */}
            <section className="mt-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Descrição</h3>
                <CopyButton
                  active={copiedField === 'descricao'}
                  onClick={() => copyText(selected.description || fallbackDesc, 'descricao')}
                  label="Copiar"
                  activeLabel="Copiado!"
                />
              </div>
              <p className="mt-2 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
                {selected.description || fallbackDesc}
              </p>
            </section>

            {/* Copiar anúncio completo */}
            <button
              onClick={() => {
                copyAd(selected)
                setCopiedField('anuncio')
                setTimeout(() => setCopiedField(null), 1800)
              }}
              className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                copiedField === 'anuncio' ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {copiedField === 'anuncio' ? <Check size={16} /> : <Copy size={16} />}
              {copiedField === 'anuncio' ? 'Anúncio completo copiado!' : 'Copiar anúncio completo'}
            </button>

            <p className="mt-3 text-center text-xs text-slate-400">
              Para fazer o pedido, use o botão “Fazer pedido” no card do produto.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
