'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL } from '@/lib/utils'
import {
  Search, Shirt, Copy, Check, ShoppingCart, ChevronLeft, ChevronRight,
  Wallet, X, Minus, Plus, ShoppingBag,
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
  const [copied, setCopied] = useState(null)
  const [photoIndex, setPhotoIndex] = useState({})

  // Modal do produto
  const [selected, setSelected] = useState(null)
  const [modalColor, setModalColor] = useState('')
  const [modalSize, setModalSize] = useState('')
  const [modalQty, setModalQty] = useState(1)
  const [modalPhoto, setModalPhoto] = useState(0)
  const [added, setAdded] = useState(false)

  // Contador do carrinho
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    load()
    loadCartCount()
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

  async function loadCartCount() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { count } = await supabase
      .from('cart_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    setCartCount(count ?? 0)
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

  function makeAd(p) {
    const sizes = p.sizes?.length ? p.sizes.join(', ') : 'P ao GG'
    const colors = p.colors?.length ? p.colors.join(', ') : 'consulte as cores'
    const title = suggestedTitle(p)
    const desc = `${
      p.description ||
      'Camiseta 100% algodão com estampa DTF de alta durabilidade, toque macio e estampa que não desbota, não trinca e não sai na lavagem.'
    }\n\n🧵 Tecido: algodão premium\n🖨️ Estampa: DTF de alta qualidade\n📏 Tamanhos: ${sizes}\n🎨 Cores: ${colors}\n\n✅ Envio rápido e protegido\n✅ Pagamento seguro (Pix / cartão)\n✅ Troca garantida em caso de defeito\n\nQualidade PlayDrop by Korvo Ecossistema.`
    return `${title}\n\n${desc}`
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
    setModalColor('')
    setModalSize('')
    setModalQty(1)
    setModalPhoto(0)
    setAdded(false)
  }

  async function addToCart() {
    if (!selected) return
    if (!modalColor || !modalSize) {
      alert('Selecione a cor e o tamanho.')
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Faça login para adicionar ao carrinho.')
      return
    }

    await supabase.from('cart_items').insert({
      user_id: user.id,
      product_id: selected.id,
      product_name: selected.name,
      image_url: photosOf(selected)[0] || null,
      color: modalColor,
      size: modalSize,
      quantity: modalQty,
      unit_cost: Number(selected.base_cost || 0),
    })

    setAdded(true)
    loadCartCount()
    setTimeout(() => {
      setSelected(null)
      setAdded(false)
    }, 1200)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Catálogo</h1>
          <p className="mt-1 text-sm text-slate-500">
            Escolha suas camisetas, veja os detalhes e adicione ao carrinho.
          </p>
        </div>
        <Link
          href="/dashboard/carrinho"
          className="relative inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <ShoppingBag size={16} /> Carrinho
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </Link>
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
              {/* Foto 250x250 — clica para abrir a janela */}
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
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold leading-snug text-slate-900 hover:text-indigo-600">{p.name}</h3>
                    {p.category && (
                      <span className="whitespace-nowrap rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                        {p.category}
                      </span>
                    )}
                  </div>
                </button>

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
                    onClick={() => copyAd(p)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    {copied === p.id ? (
                      <>
                        <Check size={14} className="text-emerald-600" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copiar anúncio
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => openModal(p)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-2 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <ShoppingCart size={14} /> Ver produto
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ===== MODAL DO PRODUTO ===== */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="grid grid-cols-1 gap-0 overflow-y-auto md:grid-cols-2">
              {/* Fotos */}
              <div className="relative flex h-72 items-center justify-center bg-slate-100 md:h-full">
                {photosOf(selected).length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photosOf(selected)[modalPhoto]}
                      alt={selected.name}
                      className="h-full w-full object-cover"
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
                  <Shirt size={48} className="text-slate-300" />
                )}
              </div>

              {/* Informações */}
              <div className="flex flex-col p-6">
                <h2 className="text-xl font-extrabold text-slate-900">{selected.name}</h2>
                {selected.category && (
                  <span className="mt-1 inline-flex w-fit rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                    {selected.category}
                  </span>
                )}

                <div className="mt-3 space-y-1 text-sm">
                  <p>
                    Custo: <b>{formatBRL(selected.base_cost)}</b>
                  </p>
                  <p>
                    Preço de venda sugerido: <b>{formatBRL(selected.suggested_price)}</b>
                  </p>
                  <div className="mt-1 rounded-lg bg-emerald-50 px-3 py-2">
                    <span className="text-xs text-emerald-700">Seu lucro estimado:</span>{' '}
                    <b className="text-emerald-700">{formatBRL(profit(selected))}</b>
                  </div>
                </div>

                {/* Título sugerido */}
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Título sugerido</p>
                  <p className="mt-1 rounded-lg bg-slate-50 p-2 text-sm text-slate-700">{suggestedTitle(selected)}</p>
                </div>

                {/* Descrição */}
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Descrição</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                    {selected.description || 'Camiseta 100% algodão com estampa DTF de alta durabilidade, toque macio e estampa que não desbota, não trinca e não sai na lavagem.'}
                  </p>
                </div>

                {/* Cor e tamanho */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Cor</p>
                    <select
                      value={modalColor}
                      onChange={(e) => setModalColor(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="">Selecione...</option>
                      {(selected.colors || []).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Tamanho</p>
                    <select
                      value={modalSize}
                      onChange={(e) => setModalSize(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="">Selecione...</option>
                      {(selected.sizes || []).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quantidade */}
                <div className="mt-4 flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Qtd</p>
                  <button
                    onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                    className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
                    aria-label="Diminuir"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center text-lg font-bold text-slate-900">{modalQty}</span>
                  <button
                    onClick={() => setModalQty((q) => q + 1)}
                    className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
                    aria-label="Aumentar"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Botões */}
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    onClick={addToCart}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    {added ? (
                      <>
                        <Check size={16} /> Adicionado ao carrinho!
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={16} /> Adicionar ao carrinho
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => copyAd(selected)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    {copied === selected.id ? (
                      <>
                        <Check size={16} className="text-emerald-600" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copiar anúncio completo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
