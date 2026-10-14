import Link from 'next/link'
import { ArrowLeft, Wrench } from 'lucide-react'

const MODULES = {
  catalogo: {
    title: 'Catálogo',
    desc: 'Aqui ficam as camisetas que você pode anunciar, com fotos prontas, preço sugerido e título/descrição para o Mercado Livre e Shopee.',
  },
  pedido: {
    title: 'Pedido',
    desc: 'Aqui você cria e acompanha seus pedidos: escolha cor, tamanho e quantidade. A PlayDrop envia direto ao seu cliente final.',
  },
  vendas: {
    title: 'Vendas',
    desc: 'Relação de todas as suas vendas e o status de cada uma no pipeline.',
  },
  financeiro: {
    title: 'Financeiro',
    desc: 'Faturamento, custos, lucro por pedido/período e pendências de pagamento.',
  },
  produtos: {
    title: 'Produtos',
    desc: 'Seus produtos e os kits prontos de anúncio: foto, título, descrição e preço sugerido.',
  },
  relatorios: {
    title: 'Relatórios',
    desc: 'Exportação em CSV/XLSX e ranking dos produtos mais vendidos.',
  },
  devolucoes: {
    title: 'Devoluções',
    desc: 'Solicitações de troca e devolução em um só lugar.',
  },
  conta: {
    title: 'Minha conta',
    desc: 'Seus dados cadastrais, CNPJ/CPF, telefone e preferências.',
  },
  admin: {
    title: 'Admin',
    desc: 'Gestão do catálogo, preços, avisos e pipeline de pedidos. Área exclusiva do ecossistema Korvo.',
  },
}

export default function ModulePage({ params }) {
  const mod = MODULES[params.page] ?? { title: 'Módulo', desc: 'Este módulo está sendo preparado.' }

  return (
    <div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft size={16} /> Voltar ao início
      </Link>

      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Wrench size={26} />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">{mod.title}</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">{mod.desc}</p>
        <p className="mt-5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
          Módulo em construção — sem dados fictícios
        </p>
      </div>
    </div>
  )
}
