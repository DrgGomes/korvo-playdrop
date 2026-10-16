import { Poppins, Caveat } from 'next/font/google'
import {
  ArrowRight, Play, Package, Factory, Zap, Headset, Shirt, Megaphone, Printer,
  Box, Users, User, Baby, Crown, Sparkles, ImageIcon, Link2, MapPin, ShieldCheck,
  PlusCircle, Instagram, Youtube, Music2, Twitter,
} from 'lucide-react'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })
const caveat = Caveat({ subsets: ['latin'], weight: ['500', '700'] })

export const metadata = {
  title: 'PlayDrop — Dropshipping de camisetas',
  description: 'Você anuncia, nós cuidamos do resto.',
}

const NAV = [
  ['Início', '#inicio'], ['Como funciona', '#como-funciona'], ['Catálogo', '#catalogo'],
  ['Vantagens', '#vantagens'], ['Planos', '#planos'], ['FAQ', '#faq'],
]

const BENEFICIOS = [
  { icon: Package, label: 'Sem estoque' },
  { icon: Factory, label: 'Produção própria' },
  { icon: Zap, label: 'Envio rápido' },
  { icon: Headset, label: 'Suporte dedicado' },
]

const MARKETPLACES = [
  { src: '/mercadolivre.png', alt: 'Mercado Livre' },
  { src: '/shopee.png', alt: 'Shopee' },
  { src: '/tiktokshop.png', alt: 'TikTok Shop' },
  { src: '/kwai.png', alt: 'Kwai' },
]

const PASSOS = [
  { icon: Shirt, titulo: 'Escolha no nosso catálogo', texto: 'Acesse nosso catálogo com milhares de camisetas e estampas exclusivas.' },
  { icon: Megaphone, titulo: 'Anuncie e venda', texto: 'Divulgue nas principais plataformas e receba seus pedidos.' },
  { icon: Printer, titulo: 'Nós produzimos', texto: 'Separamos, estampamos, embalamos e cuidamos de tudo.' },
  { icon: Box, titulo: 'O cliente recebe', texto: 'Enviamos para todo o Brasil com rastreamento e segurança.' },
]

const CATEGORIAS = [
  { icon: User, label: 'Masculino' },
  { icon: Users, label: 'Feminino' },
  { icon: Baby, label: 'Infantil' },
  { icon: Crown, label: 'Premium' },
  { icon: Sparkles, label: 'Temáticas' },
]

const VANTAGENS = [
  { icon: ImageIcon, titulo: 'Catálogo sempre atualizado', texto: 'Novas estampas e modelos toda semana.' },
  { icon: Link2, titulo: 'Integração com marketplaces', texto: 'Conecte suas lojas e gerencie tudo em um só lugar.' },
  { icon: MapPin, titulo: 'Rastreamento em tempo real', texto: 'Acompanhe seus pedidos do início ao fim.' },
  { icon: ShieldCheck, titulo: 'Suporte especializado', texto: 'Nossa equipe está pronta para te ajudar.' },
]

const RODAPE = [
  ['Início', '#inicio'], ['Como funciona', '#como-funciona'], ['Catálogo', '#catalogo'],
  ['Vantagens', '#vantagens'], ['Planos', '#planos'], ['FAQ', '#faq'],
]

export default function Page() {
  return (
    <div className={`${poppins.className} min-h-screen bg-[#02080d] text-white`}>
      {/* ===== HEADER ===== */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#02080d]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-playdrop.png" alt="PlayDrop by Korvo ecossistema" className="h-11 w-auto" />
          <ul className="hidden items-center gap-8 text-xs font-medium text-slate-200 lg:flex">
            {NAV.map(([label, href], i) => (
              <li key={label}>
                <a href={href} className={i === 0 ? 'text-cyan-400' : 'transition hover:text-cyan-300'}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <a href="https://korvo-playdrop.vercel.app" className="hidden min-h-10 items-center rounded-lg border border-white/30 px-5 text-xs font-bold transition hover:bg-white/10 sm:inline-flex">
              Entrar
            </a>
            <a href="https://korvo-playdrop.vercel.app" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-400 px-4 text-xs font-bold text-black transition hover:bg-cyan-300">
              Começar agora <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header id="inicio" className="relative overflow-hidden">
        {/* imagem com corvo + notebook + celular (lado direito) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-corvo.png"
          alt=""
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[65%] object-cover object-right lg:block"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#02080d] via-[#02080d]/90 to-transparent lg:via-[#02080d]/60" />

        <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-14 sm:pt-20">
          <div className="max-w-xl">
            <span className="inline-block rounded-full border border-cyan-400/50 bg-cyan-400/5 px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] text-cyan-300">
              DROPSHIPPING DE CAMISETAS
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              Você anuncia,
              <span className="block text-cyan-400">nós cuidamos do resto.</span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-300">
              O PlayDrop é o sistema completo para você vender camisetas sem se preocupar com estoque, produção ou envio. Mais tempo para você, mais vendas para o seu negócio.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <a href="https://korvo-playdrop.vercel.app" className="inline-flex min-h-12 items-center gap-3 rounded-lg bg-cyan-400 px-7 text-sm font-bold text-black transition hover:bg-cyan-300">
                Quero começar agora <ArrowRight size={16} />
              </a>
              <a href="#como-funciona" className="flex items-center gap-3 text-left">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40">
                  <Play size={16} fill="currentColor" />
                </span>
                <span>
                  <span className="block text-xs font-bold text-cyan-300">Assista ao vídeo</span>
                  <span className="block text-[10px] text-slate-400">1 min</span>
                </span>
              </a>
            </div>
          </div>

          <ul className="mt-14 flex flex-wrap gap-x-10 gap-y-6">
            {BENEFICIOS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2 text-xs text-slate-200">
                <Icon size={26} className="text-cyan-400" strokeWidth={1.5} />
                {label}
              </li>
            ))}
          </ul>

          {/* imagem mobile */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero-corvo.png" alt="" className="mt-10 w-full lg:hidden" />

          <p className={`${caveat.className} absolute right-8 top-8 hidden -rotate-6 text-3xl font-bold text-cyan-300 xl:block`}>
            Sua loja,<br />sem limites.
          </p>
        </div>
      </header>

      {/* ===== MARKETPLACES ===== */}
      <section className="border-y border-white/5 bg-[#03101a]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 py-8 lg:flex-row">
          <div className="lg:w-72 lg:shrink-0">
            <h2 className="text-xl font-bold leading-snug">Venda nas principais plataformas do mercado</h2>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Você escolhe onde anunciar.<br />Nós cuidamos do resto.
            </p>
          </div>
          <div className="grid w-full flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {MARKETPLACES.map((m) => (
              <div key={m.alt} className="flex h-20 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.src} alt={m.alt} className="max-h-full w-auto object-contain" />
              </div>
            ))}
            <div className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] text-[11px] text-slate-300">
              <PlusCircle size={20} className="text-cyan-400" strokeWidth={1.5} />
              E muito mais...
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section id="como-funciona" className="scroll-mt-16 bg-[#f4f9fc] text-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 lg:flex-row lg:items-center">
          <div className="lg:w-72 lg:shrink-0">
            <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-[10px] font-bold tracking-widest text-cyan-700">
              COMO FUNCIONA
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight">
              É simples.<br />É rápido. É PlayDrop.
            </h2>
            <p className="mt-4 text-sm text-slate-500">
              Do clique à entrega, tudo em um só lugar.<br />Você foca nas vendas, a gente cuida do resto.
            </p>
            <a href="#catalogo" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-cyan-400 px-5 text-xs font-bold text-black shadow-lg shadow-cyan-300/40 transition hover:bg-cyan-300">
              Quero ver como funciona <ArrowRight size={14} />
            </a>
          </div>
          <div className="grid flex-1 gap-6 rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-slate-100">
            {PASSOS.map(({ icon: Icon, titulo, texto }, i) => (
              <div key={titulo} className="relative lg:px-5">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600">
                  <Icon size={30} strokeWidth={1.7} />
                </span>
                <p className="mt-4 flex items-center gap-2 text-sm font-bold">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-[10px] text-black">
                    {i + 1}
                  </span>
                  {titulo}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATÁLOGO ===== */}
      <section id="catalogo" className="relative scroll-mt-16 overflow-hidden bg-[#02080d]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/catalogo-camisetas.png"
          alt="Camisetas com estampas variadas"
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[62%] object-cover object-left lg:block"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#02080d] via-[#02080d]/80 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-5 py-14">
          <div className="max-w-md">
            <span className="inline-block rounded-full border border-cyan-400/50 px-4 py-1 text-[10px] font-bold tracking-[0.2em] text-cyan-300">
              CATÁLOGO
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight">
              Milhares de camisetas.<br />
              Estampas para <span className="text-cyan-400">todos os estilos.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Do streetwear ao geek, do minimalista ao maximalista.<br />
              Sempre com alta qualidade e tendências atualizadas.
            </p>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-9 gap-y-5">
            {CATEGORIAS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2 text-xs text-slate-200">
                <Icon size={26} className="text-cyan-400" strokeWidth={1.5} />
                {label}
              </li>
            ))}
          </ul>
          <a href="https://korvo-playdrop.vercel.app" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-lg bg-cyan-400 px-6 text-xs font-bold text-black transition hover:bg-cyan-300">
            Ver catálogo completo <ArrowRight size={14} />
          </a>
          {/* imagem mobile */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/catalogo-camisetas.png" alt="" className="mt-8 w-full lg:hidden" />
        </div>
      </section>

      {/* ===== VANTAGENS ===== */}
      <section id="vantagens" className="scroll-mt-16 border-t border-white/5 bg-[#03101a]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[18rem_1fr]">
          <div>
            <h2 className="text-2xl font-extrabold leading-snug">Tudo o que você precisa para vender mais.</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Plataforma completa, prática e intuitiva. Com o PlayDrop, você tem controle total do seu negócio.
            </p>
            <a href="https://korvo-playdrop.vercel.app" className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-400 px-5 text-xs font-bold text-black transition hover:bg-cyan-300">
              Começar agora <ArrowRight size={14} />
            </a>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-white/10">
            {VANTAGENS.map(({ icon: Icon, titulo, texto }) => (
              <div key={titulo} className="lg:px-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-400/60 text-cyan-400">
                  <Icon size={20} strokeWidth={1.6} />
                </span>
                <h3 className="mt-4 text-sm font-bold">{titulo}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section id="planos" className="relative scroll-mt-16 overflow-hidden border-t border-white/5 bg-[#02080d]">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 py-10 lg:grid-cols-[22rem_1fr_16rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/corvo-cta.png" alt="" className="hidden max-h-56 w-auto object-contain lg:block" />
          <div className="relative">
            <h2 className="text-2xl font-extrabold leading-snug sm:text-3xl">
              Comece agora mesmo<br />
              <span className="text-cyan-400">e transforme suas vendas.</span>
            </h2>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-slate-300">
              Cadastre-se no PlayDrop e tenha acesso a um sistema completo, com tudo o que você precisa para vender camisetas online.
            </p>
            <a href="https://wa.me/5516994174280" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-cyan-400 px-5 text-xs font-bold text-black transition hover:bg-cyan-300">
              Quero ser um parceiro PlayDrop <ArrowRight size={14} />
            </a>
            <p className={`${caveat.className} absolute -top-2 right-0 hidden -rotate-6 text-2xl font-bold text-cyan-300 xl:block`}>
              Seu sucesso<br />também é<br />o nosso.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-playdrop.png" alt="PlayDrop by Korvo ecossistema" className="h-24 w-auto" />
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer id="faq" className="border-t border-white/10 bg-[#02080d]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-6 lg:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-playdrop.png" alt="PlayDrop" className="h-10 w-auto" />
          <ul className="flex flex-wrap justify-center gap-x-10 gap-y-2 text-[11px] text-slate-300">
            {RODAPE.map(([label, href]) => (
              <li key={label}><a href={href} className="transition hover:text-cyan-300">{label}</a></li>
            ))}
          </ul>
          <div className="flex items-center gap-5 text-slate-300">
            <a href="#" aria-label="Instagram" className="hover:text-cyan-300"><Instagram size={18} /></a>
            <a href="#" aria-label="TikTok" className="hover:text-cyan-300"><Music2 size={18} /></a>
            <a href="#" aria-label="YouTube" className="hover:text-cyan-300"><Youtube size={18} /></a>
            <a href="#" aria-label="X" className="hover:text-cyan-300"><Twitter size={18} /></a>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 border-t border-white/5 px-5 py-4 text-[10px] text-slate-500 sm:flex-row">
          <p>© 2025 PlayDrop. Todos os direitos reservados.</p>
          <p>Mais que um sistema. Um ecossistema.</p>
        </div>
      </footer>
    </div>
  )
}
