'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL } from '@/lib/utils'
import { Search, Shirt, Copy, Check, ShoppingCart, ChevronLeft, ChevronRight, Wallet } from 'lucide-react'

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

  // Lucro do revendedor = preço sugerido - 15% comissão - R$ 4,00 taxa fixa
  function profit(p) {
    const price = Number(p.suggested_price || 0)
    return price - price * COMISSAO - TAXA_FIXA
  }

  function makeAd(p) {
    const sizes = p.sizes?.length ? p.sizes.join(', ') : 'P ao GG'
    const colors = p.colors?.length ? p.colors.join(', ') : 'consulte as cores'
    const title = `${p.name} — Camiseta Estampada DTF Premium | ${colors}`
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

  function prevPhoto(p) {
    const photos = photosOf(p)
    const cur = photoIndex[p.id] || 0
    setPhotoIndex({ ...photoIndex, [p.id]: (cur - 1 + photos.length) % photos.length })
  }

  function nextPhoto(p) {
    const photos = photosOf(p)
    const cur = photoIndex[p.id] || 0
    setPhotoIndex({ ...photoIndex, [p.id]: (cur + 1) % photos.length })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Catálogo</h1>
        <p className="mt-1 text-sm text-slate-500">
          Escolha suas camisetas e anuncie em minutos. Fotos, títulos e descrições prontos.
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
              {/* Foto 250x250 */}
              <div className="relative flex h-[250px] w-[250px] items-center justify-center self-center bg-slate-100">
                {photos.length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photos[cur]} alt={p.name} className="h-full w-full object-cover" />
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={() => prevPhoto(p)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition hover:bg-black/70"
                          aria-label="Foto anterior"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => nextPhoto(p)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition hover:bg-black/70"
                          aria-label="Próxima foto"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                          {cur + 1}/{photos.length}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <Shirt size={42} className="text-slate-300" />
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold leading-snug text-slate-900">{p.name}</h3>
                  {p.category && (
                    <span className="whitespace-nowrap rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                      {p.category}
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  <p>
                    Custo: <span className="font-semibold text-slate-700">{formatBRL(p.base_cost)}</span>
                  </p>
                  <p>
                    Preço de venda sugerido:{' '}
                    <span className="font-semibold text-slate-700">{formatBRL(p.suggested_price)}</span>
                  </p>
                </div>

                {/* Lucro do revendedor (substitui o "Definir meu preço") */}
                <div className="mt-3 rounded-xl bg-emerald-50/70 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <Wallet size={14} /> Seu lucro estimado por peça
                  </div>
                  <p className="mt-1 text-xl font-extrabold text-emerald-700">{formatBRL(lucro)}</p>
                  <p className="mt-0.5 text-[11px] text-emerald-600/80">
                    Já descontados 15% de comissão + R$ 4,00 de taxa fixa
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
    </div>
  )
}
