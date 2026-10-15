import { createClient } from '@supabase/supabase-js'
import { ArrowDown, Shirt, Sparkles, TrendingUp, ShieldCheck, Package, MessageCircle } from 'lucide-react'

// Cliente Supabase do lado do servidor — a anon key é pública por design,
// e a política RLS "leitura publica de produtos da landing" só libera
// produtos com exibir_landing = true
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function getLandingProducts() {
  const { data } = await supabase
    .from('products')
    .select('id, name, category, description, base_cost, suggested_price, image_url, colors, sizes')
    .eq('exibir_landing', true)
    .eq('active', true)
    .order('name')
  return data ?? []
}

function formatBRL(v) {
  if (v == null) return '—'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Margem aproximada: preço sugerido - custo base
function margem(p) {
  if (p.suggested_price == null || p.base_cost == null) return null
  return Number(p.suggested_price) - Number(p.base_cost)
}

export const revalidate = 60 // atualiza o catálogo a cada 60s

export default async function VitrinePage() {
  const products = await getLandingProducts()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ===== HERO ===== */}
      <header className="mx-auto max-w-5xl px-5 pb-14 pt-14 text-center sm:pt-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300">
          <Sparkles size={14} /> Catálogo para revendedores
        </div>

        {/* Logo */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-black">
            P
          </span>
          <div className="text-left">
            <p className="text-2xl font-extrabold leading-tight">PlayDrop</p>
            <p className="text-xs text-slate-400">by Korvo Ecossistema</p>
          </div>
        </div>

        <h1 className="mt-8 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Revenda camisetas estampadas
          <span className="block text-indigo-400">com a sua marca</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-slate-400">
          Escolha os produtos no catálogo, anuncie com o seu preço e lucre em cada
          peça. Nós cuidamos da confecção e da estamparia.
        </p>
        <a
          href="#catalogo"
          className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-8 text-base font-bold transition hover:bg-indigo-500"
        >
          Ver catálogo <ArrowDown size={18} />
        </a>
      </header>

      {/* ===== COMO FUNCIONA ===== */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Shirt, titulo: 'Escolha seus produtos', texto: 'Selecione os modelos que combinam com o seu público.' },
            { icon: Package, titulo: 'Receba com sua marca', texto: 'Peças prontas para você vender e entregar.' },
            { icon: TrendingUp, titulo: 'Venda e lucre', texto: 'Você define o preço. A margem é sua.' },
          ].map((item, i) => (
            <div key={i} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400">
                <item.icon size={22} />
              </span>
              <h3 className="mt-4 font-bold">{item.titulo}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{item.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CATÁLOGO ===== */}
      <section id="catalogo" className="mx-auto max-w-5xl scroll-mt-6 px-5 pb-20">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold">Nosso catálogo</h2>
          <p className="mt-2 text-sm text-slate-400">
            Confira os modelos disponíveis e a margem aproximada de lucro por peça.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-800 px-6 py-16 text-center text-slate-400">
            <Shirt size={32} className="mx-auto text-slate-600" />
            <p className="mt-4 font-semibold text-slate-300">Catálogo sendo atualizado</p>
            <p className="mt-1 text-sm">Novos modelos chegando em breve. Fale com a gente!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const m = margem(p)
              return (
                <article
                  key={p.id}
                  className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 transition hover:border-indigo-500/50"
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
                        <Shirt size={48} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    {p.category && (
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">{p.category}</p>
                    )}
                    <h3 className="mt-1 font-bold leading-snug">{p.name}</h3>
                    {p.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">{p.description}</p>
                    )}
                    {(p.colors?.length > 0 || p.sizes?.length > 0) && (
                      <p className="mt-2 text-xs text-slate-500">
                        {p.colors?.length > 0 && `${p.colors.length} cores`}
                        {p.colors?.length > 0 && p.sizes?.length > 0 && ' · '}
                        {p.sizes?.length > 0 && `P ao GG`}
                      </p>
                    )}
                    {m != null && m > 0 && (
                      <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-500/10 px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                          <TrendingUp size={14} /> Lucro aprox.
                        </span>
                        <span className="text-lg font-extrabold text-emerald-400">
                          {formatBRL(m)}
                          <span className="text-xs font-medium text-emerald-500/70">/peça</span>
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
        <p className="mt-6 text-center text-xs text-slate-500">
          Valores de margem aproximados. Catálogo completo disponível na plataforma.
        </p>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="bg-indigo-600">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center">
          <h2 className="text-3xl font-extrabold">Pronto para começar a revender?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-indigo-100">
            Crie sua conta na plataforma, escolha seus produtos e comece a vender hoje.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://wa.me/5500000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-7 font-bold text-indigo-700 transition hover:bg-indigo-50"
            >
              <MessageCircle size={18} /> Falar com a Korvo
            </a>
            <a
              href="https://korvo-playdrop.vercel.app"
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/40 px-7 font-bold text-white transition hover:bg-white/10"
            >
              Acessar plataforma
            </a>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-5 py-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black">P</span>
            <p className="font-bold">PlayDrop <span className="text-xs font-normal text-slate-500">by Korvo Ecossistema</span></p>
          </div>
          <p className="mt-3 text-xs text-slate-600">
            © 2026 Korvo Ecossistema. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
