'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL } from '@/lib/utils'
import { Search, Shirt, Copy, Check, ShoppingCart, TrendingUp } from 'lucide-react'

export default function CatalogoPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('todas')
  const [selectedId, setSelectedId] = useState(null)
  const [margin, setMargin] = useState(100)
  const [copied, setCopied] = useState(null)

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

  function sellingPrice(p) {
    return Number(p.base_cost || 0) * (1 + margin / 100)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Catálogo</h1>
        <p className="mt-1 text-sm text-slate-500">
          Escolha suas camisetas, defina seu preço e anuncie em minutos. Fotos, títulos e descrições prontos.
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

      {/* Estado de carregamento */}
      {loading && <p className="text-sm text-slate-400">Carregando catálogo...</p>}

      {/* Estado vazio */}
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
          const open = selectedId === p.id
          return (
            <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex h-44 items-center justify-center bg-slate-100">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
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
                    Seu custo: <span className="font-semibold text-slate-700">{formatBRL(p.base_cost)}</span>
                  </p>
                  <p>
                    Preço sugerido:{' '}
                    <span className="font-semibold text-slate-700">{formatBRL(p.suggested_price)}</span>
                  </p>
                </div>

                {open ? (
                  <div className="mt-3 rounded-xl bg-indigo-50/70 p-3">
                    <label className="text-xs font-medium text-slate-600">Sua margem de lucro (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={margin}
                      onChange={(e) => setMargin(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                      <p>
                        Seu preço de venda: <b>{formatBRL(sellingPrice(p))}</b>
                      </p>
                      <p>
                        Lucro por peça:{' '}
                        <b className="text-emerald-600">
                          {formatBRL(sellingPrice(p) - Number(p.base_cost || 0))}
                        </b>
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedId(p.id)
                      setMargin(100)
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                  >
                    <TrendingUp size={15} /> Definir meu preço
                  </button>
                )}

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
