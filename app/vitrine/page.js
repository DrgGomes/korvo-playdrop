import {
  ArrowRight, Play, Shirt, Megaphone, Printer, Package,
  Image as ImageIcon, Share2, Truck, Headphones, Plus,
  User, Baby, Crown, Sparkles,
} from 'lucide-react'
// ===== Ícones sociais (SVGs oficiais — Simple Icons) =====
const socials = [
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    path: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077',
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com',
    path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
  {
    name: 'X',
    href: 'https://x.com',
    path: 'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z',
  },
]
// ===== Dados =====
const navLinks = [
  { label: 'Início', href: '#inicio' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Catálogo', href: '#catalogo' },
  { label: 'Vantagens', href: '#vantagens' },
  { label: 'Planos', href: '#planos' },
  { label: 'FAQ', href: '#faq' },
]
const heroFeatures = [
  { icon: Package, label: 'Sem estoque' },
  { icon: Shirt, label: 'Produção própria' },
  { icon: Truck, label: 'Envio rápido' },
  { icon: Headphones, label: 'Suporte dedicado' },
]
const passos = [
  { icon: Shirt, titulo: '1. Escolha no nosso catálogo', texto: 'Acesse nosso catálogo com milhares de camisetas e estampas exclusivas.' },
  { icon: Megaphone, titulo: '2. Anuncie e venda', texto: 'Divulgue nas principais plataformas e receba seus pedidos.' },
  { icon: Printer, titulo: '3. Nós produzimos', texto: 'Separamos, estampamos, embalamos e cuidamos de tudo.' },
  { icon: Package, titulo: '4. O cliente recebe', texto: 'Enviamos para todo o Brasil com rastreamento e segurança.' },
]
const categorias = [
  { icon: User, label: 'Masculino' },
  { icon: User, label: 'Feminino' },
  { icon: Baby, label: 'Infantil' },
  { icon: Crown, label: 'Premium' },
  { icon: Sparkles, label: 'Temáticas' },
]
const vantagens = [
  { icon: ImageIcon, titulo: 'Catálogo sempre atualizado', texto: 'Novas estampas e modelos toda semana.' },
  { icon: Share2, titulo: 'Integração com marketplaces', texto: 'Conecte suas lojas e gerencie tudo em um só lugar.' },
  { icon: Truck, titulo: 'Rastreamento em tempo real', texto: 'Acompanhe seus pedidos do início ao fim.' },
  { icon: Headphones, titulo: 'Suporte especializado', texto: 'Nossa equipe está pronta para te ajudar.' },
]
const APP_URL = 'https://korvo-playdrop.vercel.app'
export default function PlayDropLanding() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* ===== HEADER ===== */}
      <nav id="inicio" className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <a href="#inicio" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-playdrop.png" alt="PlayDrop by Korvo ecossistema" className="h-11 w-auto" />
          </a>
          <ul className="hidden items-center gap-6 text-sm font-medium text-slate-300 lg:flex">
            {navLinks.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="transition hover:text-cyan-400">{l.label}</a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <a
              href={APP_URL}
              className="hidden min-h-10 items-center rounded-xl px-4 text-sm font-semibold text-white transition hover:text-cyan-400 sm:inline-flex"
            >
              Entrar
            </a>
            <a
              href={APP_URL}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-cyan-400 px-4 text-sm font-bold text-black transition hover:bg-cyan-300"
            >
              Começar agora <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </nav>
      {/* ===== HERO ===== */}
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-10 pt-14 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Você anuncia,
              <span className="block">nós cuidamos do resto.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
              O PlayDrop é o sistema completo para você vender camisetas sem se
              preocupar com estoque, produção ou envio. Mais tempo para você,
              mais vendas para o seu negócio.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={APP_URL}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-cyan-400 px-7 text-base font-bold text-black transition hover:bg-cyan-300"
              >
                Quero começar agora <ArrowRight size={18} />
              </a>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2.5 text-sm font-semibold text-slate-300 transition hover:text-white"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-400">
                  <Play size={16} fill="currentColor" />
                </span>
                Assista ao vídeo
                <span className="text-xs font-normal text-slate-500">1 min</span>
              </a>
            </div>
          </div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-visual.png"
              alt="Corvo PlayDrop com catálogo de camisetas no celular e no notebook"
              className="mx-auto w-full max-w-xl drop-shadow-[0_0_40px_rgba(34,211,238,0.15)]"
            />
            <p
              className="absolute -bottom-2 right-2 text-2xl text-white sm:text-3xl"
              style={{ fontFamily: "'Caveat','Segoe Script',cursive" }}
            >
              Sua loja, sem limites.
            </p>
          </div>
        </div>
        {/* ícones de destaque */}
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 border-t border-white/5 px-5 py-8 sm:grid-cols-4">
          {heroFeatures.map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-2 text-center">
              <f.icon size={26} className="text-cyan-400" />
              <span className="text-sm font-semibold text-slate-300">{f.label}</span>
            </div>
          ))}
        </div>
      </header>
      {/* ===== PLATAFORMAS ===== */}
      <section className="border-y border-white/5 bg-slate-950/60">
        <div className="mx-auto max-w-6xl px-5 py-12 text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Venda nas principais plataformas do mercado
          </h2>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Você escolhe onde anunciar. Nós cuidamos do resto.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos-plataformas.png"
            alt="Mercado Livre, Shopee, TikTok Shop, Kwai e muito mais"
            className="mx-auto mt-8 w-full max-w-4xl"
          />
        </div>
      </section>
      {/* ===== COMO FUNCIONA ===== */}
      <section id="como-funciona" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">Como funciona</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">É simples. É rápido. É PlayDrop.</h2>
            <p className="mt-4 text-slate-400">
              Do clique à entrega, tudo em um só lugar. Você foca nas vendas, a gente cuida do resto.
            </p>
            <a
              href={APP_URL}
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-cyan-400 px-7 text-base font-bold text-black transition hover:bg-cyan-300"
            >
              Quero ver como funciona <ArrowRight size={18} />
            </a>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {passos.map((p) => (
              <div
                key={p.titulo}
                className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 transition hover:border-cyan-500/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
                  <p.icon size={24} />
                </span>
                <h3 className="mt-4 font-bold leading-snug">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ===== CATÁLOGO ===== */}
      <section id="catalogo" className="scroll-mt-24 border-y border-white/5 bg-slate-950/60">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">Catálogo</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                Milhares de camisetas. Estampas para todos os estilos.
              </h2>
              <p className="mt-4 text-slate-400">
                Do streetwear ao geek, do minimalista ao maximalista. Sempre com
                alta qualidade e tendências atualizadas.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                {categorias.map((c) => (
                  <span key={c.label} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <c.icon size={18} className="text-cyan-400" /> {c.label}
                  </span>
                ))}
              </div>
              <a
                href="/catalogo"
                className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-cyan-400 px-7 text-base font-bold text-black transition hover:bg-cyan-300"
              >
                Ver catálogo completo <ArrowRight size={18} />
              </a>
            </div>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/catalogo-collage.png"
                alt="Colagem de camisetas com estampas variadas"
                className="w-full rounded-3xl border border-white/10"
              />
              <span className="absolute -right-2 bottom-4 flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400 text-black shadow-lg shadow-cyan-500/30">
                <Plus size={22} strokeWidth={3} />
              </span>
            </div>
          </div>
        </div>
      </section>
      {/* ===== VANTAGENS ===== */}
      <section id="vantagens" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black sm:text-4xl">
              Tudo o que você precisa para vender mais.
            </h2>
            <p className="mt-4 text-slate-400">
              Plataforma completa, prática e intuitiva. Com o PlayDrop, você tem
              controle total do seu negócio.
            </p>
            <a
              href={APP_URL}
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-cyan-400 px-7 text-base font-bold text-black transition hover:bg-cyan-300"
            >
              Começar agora <ArrowRight size={18} />
            </a>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {vantagens.map((v) => (
              <div
                key={v.titulo}
                className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 transition hover:border-cyan-500/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
                  <v.icon size={24} />
                </span>
                <h3 className="mt-4 font-bold">{v.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{v.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ===== CTA FINAL ===== */}
      <section className="border-t border-white/5 bg-gradient-to-b from-slate-950 to-black">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="order-2 lg:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/corvo-cta.png"
              alt="Corvo PlayDrop"
              className="mx-auto w-full max-w-sm drop-shadow-[0_0_40px_rgba(34,211,238,0.15)]"
            />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-black leading-tight sm:text-4xl">
              Comece agora mesmo
              <span className="block">e transforme suas vendas.</span>
            </h2>
            <p className="mt-4 max-w-lg text-slate-400">
              Cadastre-se no PlayDrop e tenha acesso a um sistema completo, com
              tudo o que você precisa para vender camisetas online.
            </p>
            <a
              href={APP_URL}
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-cyan-400 px-7 text-base font-bold text-black transition hover:bg-cyan-300"
            >
              Quero ser um parceiro PlayDrop <ArrowRight size={18} />
            </a>
            <p
              className="mt-5 text-2xl text-slate-300 sm:text-3xl"
              style={{ fontFamily: "'Caveat','Segoe Script',cursive" }}
            >
              Seu sucesso também é o nosso.
            </p>
          </div>
        </div>
      </section>
      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 bg-black">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex flex-col items-center gap-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-playdrop.png" alt="PlayDrop by Korvo ecossistema" className="h-12 w-auto" />
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
              {navLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="transition hover:text-cyan-400">{l.label}</a>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-cyan-400/50 hover:text-cyan-400"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
            <p className="text-xs text-slate-500">© 2025 PlayDrop. Todos os direitos reservados.</p>
            <p className="text-sm font-semibold text-slate-300">Mais que um sistema. Um ecossistema.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
