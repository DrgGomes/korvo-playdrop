import { createClient } from '@supabase/supabase-js'
import {
  ArrowDown, Shirt, Sparkles, TrendingUp, Package, MessageCircle,
  CheckCircle2, Palette, CreditCard, Truck, Undo2, Headphones,
  ClipboardList, Wallet,
} from 'lucide-react'

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

function margem(p) {
  if (p.suggested_price == null || p.base_cost == null) return null
  return Number(p.suggested_price) - Number(p.base_cost)
}

export const revalidate = 60

export default async function VitrinePage() {
  const products = await getLandingProducts()
  const maiorMargem = products.reduce((max, p) => {
    const m = margem(p)
    return m != null && m > max ? m : max
  }, 0)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ===== HEADER FIXO ===== */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-playdrop.png" alt="PlayDrop" className="h-14 w-auto" />
          <a
            href="/catalogo"
            className="inline-flex min-h-11 items-center rounded-xl bg-cyan-400 px-4 text-sm font-bold text-black transition hover:bg-cyan-300"
          >
            Ver catálogo
          </a>
        </div>
      </nav>

      {/* ===== BANNER DE MARCA ===== */}
      <section className="bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/banner-playdrop.png"
          alt="PlayDrop by Korvo Ecossistema — Seu produto no digital, mais perto do seu cliente."
          className="mx-auto block w-full max-w-4xl"
        />
      </section>

      {/* ===== HERO DE RESULTADO ===== */}
      <header className="mx-auto max-w-5xl px-5 pb-16 pt-12 text-center sm:pt-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300">
          <Sparkles size={14} /> Vagas abertas para novos revendedores este mês
        </div>
        <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Sua operação de revenda,
          <span className="block text-cyan-400">do catálogo ao lucro.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-slate-400">
          Você escolhe as peças, anuncia com o seu preço e a margem é sua.
          A gente cuida da confecção, da estamparia e do acompanhamento de cada pedido.
        </p>
        {maiorMargem > 0 && (
          <div className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-3">
            <TrendingUp size={18} className="text-emerald-400" />
            <span className="text-sm font-medium text-emerald-200">
              Lucro de até <strong className="text-lg font-extrabold">{formatBRL(maiorMargem)}</strong> por peça vendida
            </span>
          </div>
        )}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="/catalogo" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-8 text-base font-bold text-black transition hover:bg-cyan-300 sm:w-auto">
            Ver catálogo <ArrowDown size={18} />
          </a>
          <a href="https://korvo-playdrop.vercel.app" className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/20 px-8 text-base font-bold transition hover:bg-white/10 sm:w-auto">
            Acessar plataforma
          </a>
        </div>
      </header>

      {/* ===== DEMO VIVA: pedido fluindo ===== */}
      <section className="mx-auto -mt-8 max-w-5xl px-5 pb-16">
        <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-cyan-950/40">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
            <span className="flex items-center gap-2 text-sm font-bold">
              <ClipboardList size={16} className="text-cyan-400" /> Pedido #1042
            </span>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">Pago · PIX</span>
          </div>
          <div className="space-y-3 px-5 py-4">
            {['Em produção', 'Estampado e pronto', 'Etiqueta emitida'].map((etapa, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-700 text-[10px] font-bold text-slate-500">
                  {i + 1}
                </span>
                {etapa}
              </div>
            ))}
            <div className="flex items-center gap-3 rounded-2xl bg-cyan-500/10 px-4 py-3">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
              <p className="text-xs text-slate-300">
                Revendedor acompanha cada etapa <strong className="text-white">em tempo real</strong> na plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <h2 className="text-center text-2xl font-extrabold sm:text-3xl">Como funciona para você, revendedor</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: '01', titulo: 'Cadastre-se grátis', texto: 'Sem mensalidade e sem custo para ser revendedor.' },
            { n: '02', titulo: 'Escolha no catálogo', texto: 'Modelos, cores e tamanhos com preço de revenda.' },
            { n: '03', titulo: 'Monte seu pedido', texto: 'Peça à vista ou no prazo que a Korvo liberar.' },
            { n: '04', titulo: 'Venda e lucre', texto: 'Você define o preço final. O lucro por peça é seu.' },
          ].map((p, i) => (
            <div key={i} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <span className="text-2xl font-black text-cyan-500/60">{p.n}</span>
              <h3 className="mt-3 font-bold">{p.titulo}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{p.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CATÁLOGO ===== */}
      <section id="catalogo" className="mx-auto max-w-5xl scroll-mt-20 px-5 pb-20">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold">Nosso catálogo</h2>
          <p className="mt-2 text-sm text-slate-400">
            Modelos disponíveis e a margem aproximada de lucro por peça.
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
                  className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 transition hover:border-cyan-500/50"
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
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">{p.category}</p>
                    )}
                    <h3 className="mt-1 font-bold leading-snug">{p.name}</h3>
                    {p.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">{p.description}</p>
                    )}
                    {(p.colors?.length > 0 || p.sizes?.length > 0) && (
                      <p className="mt-2 text-xs text-slate-500">
                        {p.colors?.length > 0 && `${p.colors.length} cores`}
                        {p.colors?.length > 0 && p.sizes?.length > 0 && ' · '}
                        {p.sizes?.length > 0 && `${p.sizes.length} tamanhos`}
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

      {/* ===== O QUE VOCÊ CONTROLA ===== */}
      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
            Tudo que você controla na plataforma
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-slate-400">
            Não é só catálogo: é uma operação completa no seu celular.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Shirt, titulo: 'Catálogo exclusivo', texto: 'Modelos, cores, tamanhos e preços de revenda em um só lugar.' },
              { icon: Wallet, titulo: 'Custos e margem claros', texto: 'Você vê quanto lucra em cada peça antes de anunciar.' },
              { icon: ClipboardList, titulo: 'Pedidos organizados', texto: 'Do carrinho à produção, com histórico de tudo.' },
              { icon: CreditCard, titulo: 'Pagamento via PIX', texto: 'Comprovante anexado e status de aprovação em tempo real.' },
              { icon: Palette, titulo: 'Arte personalizada', texto: 'Anexe a arte da sua estampa direto no pedido.' },
              { icon: Truck, titulo: 'Acompanhamento', texto: 'Saiba quando saiu da produção e quando chegou.' },
              { icon: Undo2, titulo: 'Devoluções justas', texto: 'Solicite devolução pelo app com histórico completo.' },
              { icon: Headphones, titulo: 'Suporte humano', texto: 'Fala direto com a Korvo quando precisar.' },
              { icon: Package, titulo: 'Sem estoque parado', texto: 'Produção sob demanda: você vende primeiro, a gente produz.' },
            ].map((m, i) => (
              <div key={i} className="flex gap-4 rounded-2xl border border-slate-800 bg-black/60 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                  <m.icon size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-bold">{m.titulo}</h3>
                  <p className="mt-1 text-sm text-slate-400">{m.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="bg-cyan-400">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-black/10 px-4 py-1.5 text-xs font-bold text-black">
            🔥 Vagas para novos revendedores este mês
          </div>
          <h2 className="mt-5 text-3xl font-extrabold text-black">Pronto para começar a revender?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium text-black/70">
            Crie sua conta grátis, escolha seus produtos e comece a lucrar esta semana.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://wa.me/5516994174280"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-7 font-bold text-cyan-300 transition hover:bg-slate-900 sm:w-auto"
            >
              <MessageCircle size={18} /> Falar com a Korvo
            </a>
            <a
              href="https://korvo-playdrop.vercel.app"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-black/40 px-7 font-bold text-black transition hover:bg-black/10 sm:w-auto"
            >
              Criar conta grátis
            </a>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-800 bg-black">
        <div className="mx-auto max-w-5xl px-5 py-8 text-center">
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-playdrop.png" alt="PlayDrop" className="h-12 w-auto" />
            <p className="text-xs text-slate-500">© 2026 Korvo Ecossistema. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
