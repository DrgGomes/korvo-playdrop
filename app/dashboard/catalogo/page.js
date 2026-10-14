'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL } from '@/lib/utils'
import {
  Search, Shirt, Copy, Check, ChevronLeft, ChevronRight,
  Wallet, X, Download, FileText, ShoppingCart, ClipboardList,
  Grid3X3, Trash2, Zap,
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
  const [copiedField, setCopiedField] = useState(null)
  const [photoIndex, setPhotoIndex] = useState({})
  const [cartCount, setCartCount] = useState(0)

  // Modal de material de divulgação
  const [materialProduct, setMaterialProduct] = useState(null)
  const [modalPhoto, setModalPhoto] = useState(0)

  // Modal de pedido rápido (grade cores × tamanhos)
  const [orderProduct, setOrderProduct] = useState(null)
  const [selColors, setSelColors] = useState([])
  const [selSizes, setSelSizes] = useState([])
  const [qtyGrid, setQtyGrid] = useState({}) // { "Cor|Tamanho": qty }
  const [adding, setAdding] = useState(false)
  const [addedOk, setAddedOk] = useState(false)

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

  const fallbackDesc =
    'Camiseta 100% algodão com estampa DTF de alta durabilidade, toque macio e estampa que não desbota, não trinca e não sai na lavagem.'

  function makeAd(p) {
    const sizes = p.sizes?.length ? p.sizes.join(', ') : 'P ao GG'
    const colors = p.colors?.length ? p.colors.join(', ') : 'consulte as cores'
    const title = suggestedTitle(p)
    const desc = `${p.description || fallbackDesc}\n\n📏 Tamanhos: ${sizes}\n🎨 Cores: ${colors}\n\n✅ Envio rápido e protegido\n✅ Pagamento seguro (Pix / cartão)\n✅ Troca garantida em caso de defeito\n\nQualidade PlayDrop by Korvo Ecossistema.`
    return `${title}\n\n${desc}`
  }

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

  // ===== MATERIAL =====
  function openMaterial(p) {
    setMaterialProduct(p)
    setModalPhoto(0)
  }

  // ===== PEDIDO RÁPIDO =====
  function openOrder(p) {
    setOrderProduct(p)
    setSelColors([])
    setSelSizes([])
    setQtyGrid({})
    setAddedOk(false)
  }

  function toggleSel(list, setList, value) {
    if (list.includes(value)) setList(list.filter((v) => v !== value))
    else setList([...list, value])
  }

  function setCell(color, size, value) {
    const key = `${color}|${size}`
    const n = Math.max(0, Math.floor(Number(value) || 0))
    setQtyGrid((g) => ({ ...g, [key]: n }))
  }

  function fillRow(color) {
    setQtyGrid((g) => {
      const next = { ...g }
      selSizes.forEach((s) => {
        next[`${color}|${s}`] = 1
      })
      return next
    })
  }

  function fillCol(size) {
    setQtyGrid((g) => {
      const next = { ...g }
      selColors.forEach((c) => {
        next[`${c}|${size}`] = 1
      })
      return next
    })
  }

  function fillAll() {
    const next = {}
    selColors.forEach((c) => selSizes.forEach((s) => { next[`${c}|${s}`] = 1 }))
    setQtyGrid(next)
  }

  function clearAll() {
    setQtyGrid({})
  }

  const gridTotal = Object.values(qtyGrid).reduce((s, q) => s + Number(q || 0), 0)
  const gridCost = orderProduct ? gridTotal * Number(orderProduct.base_cost || 0) : 0

  async function addAllToCart() {
    if (!orderProduct) return
    const entries = Object.entries(qtyGrid).filter(([, q]) => Number(q) > 0)
    if (entries.length === 0) {
      alert('Preencha pelo menos uma quantidade na grade.')
      return
    }
    setAdding(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Faça login para adicionar ao carrinho.')
      setAdding(false)
      return
    }

    const rows = entries.map(([key, qty]) => {
      const [color, size] = key.split('|')
      return {
        user_id: user.id,
        product_id: orderProduct.id,
        product_name: orderProduct.name,
        image_url: photosOf(orderProduct)[0] || null,
        color,
        size,
        quantity: Number(qty),
        unit_cost: Number(orderProduct.base_cost || 0),
      }
    })

    const { error } = await supabase.from('cart_items').insert(rows)
    setAdding(false)

    if (error) {
      alert('Erro ao adicionar ao carrinho. Tente novamente.')
      return
    }

    setAddedOk(true)
    loadCartCount()
    setTimeout(() => {
      setOrderProduct(null)
      setAddedOk(false)
    }, 1200)
  }

  const CopyButton = ({ active, onClick, label, activeLabel }) => (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
        active ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      {active ? <Check size={13} /> : <Copy size={13} />}
      {active ? activeLabel : label}
    </button>
  )

  const chipOn = 'bg-indigo-600 text-white border-indigo-600'
  const chipOff = 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Catálogo</h1>
          <p className="mt-1 text-sm text-slate-500">
            Abra o produto para ver o material de divulgação ou fazer um pedido rápido com várias cores e tamanhos.
          </p>
        </div>
        <Link
          href="/dashboard/carrinho"
          className="relative inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <ShoppingCart size={16} /> Carrinho
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
              {/* Foto 250x250 */}
              <button
                onClick={() => openMaterial(p)}
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
                <button onClick={() => openMaterial(p)} className="text-left">
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

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => openMaterial(p)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 px-1.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                    title="Material de divulgação"
                  >
                    <FileText size={13} /> Material
                  </button>
                  <button
                    onClick={() => openOrder(p)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-600 px-1.5 py-2 text-[11px] font-semibold text-white transition hover:bg-indigo-700"
                    title="Pedido rápido (grade de cores e tamanhos)"
                  >
                    <Zap size={13} /> Pedir
                  </button>
                  <Link
                    href="/dashboard/carrinho"
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 px-1.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                    title="Ver carrinho"
                  >
                    <ShoppingCart size={13} /> Carrinho
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ===== MODAL: MATERIAL DE DIVULGAÇÃO ===== */}
      {materialProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-600">
                  <ClipboardList size={12} /> Material de divulgação
                </span>
                <h2 className="mt-2 text-xl font-extrabold text-slate-900">{materialProduct.name}</h2>
                {materialProduct.category && (
                  <p className="mt-0.5 text-sm font-medium text-indigo-600">{materialProduct.category}</p>
                )}
              </div>
              <button
                onClick={() => setMaterialProduct(null)}
                className="shrink-0 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 flex flex-col items-center">
              <div className="relative h-52 w-52">
                {photosOf(materialProduct).length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photosOf(materialProduct)[modalPhoto]}
                      alt={materialProduct.name}
                      className="h-full w-full rounded-2xl border border-slate-200 object-cover"
                    />
                    {photosOf(materialProduct).length > 1 && (
                      <>
                        <button
                          onClick={() => setModalPhoto((modalPhoto - 1 + photosOf(materialProduct).length) % photosOf(materialProduct).length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                          aria-label="Anterior"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => setModalPhoto((modalPhoto + 1) % photosOf(materialProduct).length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                          aria-label="Próxima"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                          {modalPhoto + 1}/{photosOf(materialProduct).length}
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

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {photosOf(materialProduct).map((url, i) => (
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

            <section className="mt-6">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Título sugerido</h3>
                <CopyButton
                  active={copiedField === 'titulo'}
                  onClick={() => copyText(suggestedTitle(materialProduct), 'titulo')}
                  label="Copiar"
                  activeLabel="Copiado!"
                />
              </div>
              <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{suggestedTitle(materialProduct)}</p>
            </section>

            <section className="mt-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Ficha do produto</h3>
                <CopyButton
                  active={copiedField === 'ficha'}
                  onClick={() => copyText(fichaText(materialProduct), 'ficha')}
                  label="Copiar ficha"
                  activeLabel="Copiado!"
                />
              </div>
              <div className="mt-2 rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap gap-1.5">
                  {(materialProduct.colors || []).map((c) => (
                    <span key={c} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {c}
                    </span>
                  ))}
                  {(materialProduct.sizes || []).map((s) => (
                    <span key={s} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Descrição</h3>
                <CopyButton
                  active={copiedField === 'descricao'}
                  onClick={() => copyText(materialProduct.description || fallbackDesc, 'descricao')}
                  label="Copiar"
                  activeLabel="Copiado!"
                />
              </div>
              <p className="mt-2 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
                {materialProduct.description || fallbackDesc}
              </p>
            </section>

            <button
              onClick={() => {
                copyAd(materialProduct)
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
          </div>
        </div>
      )}

      {/* ===== MODAL: PEDIDO RÁPIDO (grade cores × tamanhos) ===== */}
      {orderProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                  <Zap size={12} /> Pedido rápido
                </span>
                <h2 className="mt-2 text-xl font-extrabold text-slate-900">{orderProduct.name}</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Selecione as cores e tamanhos, digite as quantidades e adicione tudo de uma vez.
                </p>
              </div>
              <button
                onClick={() => setOrderProduct(null)}
                className="shrink-0 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Passo 1: cores */}
            <section className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                1. Escolha as cores {selColors.length > 0 && <span className="text-indigo-600">({selColors.length} selecionadas)</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {(orderProduct.colors || []).map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleSel(selColors, setSelColors, c)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${selColors.includes(c) ? chipOn : chipOff}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </section>

            {/* Passo 2: tamanhos */}
            <section className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                2. Escolha os tamanhos {selSizes.length > 0 && <span className="text-indigo-600">({selSizes.length} selecionados)</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {(orderProduct.sizes || []).map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSel(selSizes, setSelSizes, s)}
                    className={`rounded-xl border px-4 py-1.5 text-sm font-semibold transition ${selSizes.includes(s) ? chipOn : chipOff}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            {/* Passo 3: grade de quantidades */}
            {selColors.length > 0 && selSizes.length > 0 && (
              <section className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    3. Quantidades <span className="inline-flex items-center gap-1 text-slate-400"><Grid3X3 size={12} /> (cor × tamanho)</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={fillAll}
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      Preencher tudo com 1
                    </button>
                    <button
                      onClick={clearAll}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      <Trash2 size={12} /> Limpar
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-center text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2 text-left">Cor / Tamanho</th>
                        {selSizes.map((s) => (
                          <th key={s} className="px-2 py-2">
                            {s}
                            <button
                              onClick={() => fillCol(s)}
                              className="ml-1 rounded bg-slate-200 px-1 text-[10px] font-bold text-slate-600 hover:bg-slate-300"
                              title="Preencher toda a coluna com 1"
                            >
                              ×1
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selColors.map((c) => (
                        <tr key={c} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-left font-semibold text-slate-800">
                            {c}
                            <button
                              onClick={() => fillRow(c)}
                              className="ml-1.5 rounded bg-slate-200 px-1 text-[10px] font-bold text-slate-600 hover:bg-slate-300"
                              title="Preencher toda a linha com 1"
                            >
                              ×1
                            </button>
                          </td>
                          {selSizes.map((s) => (
                            <td key={s} className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                value={qtyGrid[`${c}|${s}`] ?? ''}
                                onChange={(e) => setCell(c, s, e.target.value)}
                                placeholder="0"
                                className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-center text-sm font-semibold outline-none focus:border-indigo-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Resumo e botão */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-slate-50 p-4">
              <div className="text-sm">
                <p>
                  Total: <b className="text-slate-900">{gridTotal} peça(s)</b>
                </p>
                <p className="text-slate-500">
                  Total a pagar: <b className="text-indigo-700">{formatBRL(gridCost)}</b> ({formatBRL(orderProduct.base_cost)} por peça)
                </p>
              </div>
              <button
                onClick={addAllToCart}
                disabled={adding || gridTotal === 0}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${
                  addedOk ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'
                } disabled:opacity-50`}
              >
                {addedOk ? (
                  <>
                    <Check size={16} /> Adicionado ao carrinho!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    {adding ? 'Adicionando...' : `Adicionar ${gridTotal > 0 ? `${gridTotal} peça(s)` : 'ao carrinho'}`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
