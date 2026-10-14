import './globals.css'
import { BRAND } from '@/lib/brand'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PlayDrop by Korvo Ecossistema',
  description:
    'SaaS de dropshipping de camisetas estampadas para revendedores iniciantes — do catálogo ao envio, sem estoque.',
  icons: { icon: BRAND.faviconUrl },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
