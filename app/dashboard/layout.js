'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checking, setChecking] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const isAdminArea = pathname?.startsWith('/dashboard/admin')

  useEffect(() => {
    // Área do admin tem layout próprio — nada a checar aqui
    if (pathname?.startsWith('/dashboard/admin')) {
      setChecking(false)
      return
    }
    check()
  }, [pathname])

  async function check() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role === 'admin') {
      router.replace('/dashboard/admin')
      return
    }

    setChecking(false)
  }

  // ===== ÁREA DO ADMIN: renderiza SÓ o conteúdo, sem Sidebar/Topbar do cliente =====
  if (isAdminArea) {
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
