'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    check()
  }, [])

  async function check() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Se for admin, manda direto para o painel administrativo
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

  // Enquanto verifica o perfil, mostra tela em branco (evita piscar o painel do cliente)
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
