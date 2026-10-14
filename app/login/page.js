'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { BRAND } from '@/lib/brand'
import { ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)
        setLoading(false)
        return
      }
      window.location.href = '/dashboard'
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setMessage('Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme o e-mail e depois faça login.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md">
                <div className="flex flex-col items-center text-center">
          {BRAND.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={BRAND.logoUrl} alt="PlayDrop by Korvo Ecossistema" className="h-16 w-auto" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 font-extrabold text-white shadow-lg shadow-indigo-900/50">
              P
            </div>
          )}
          {BRAND.mascoteUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={BRAND.mascoteUrl} alt="Mascote PlayDrop" className="mt-6 h-24 w-auto" />
          ) : (
            <h1 className="mt-6 text-2xl font-extrabold text-white">PlayDrop</h1>
          )}
          <p className="mt-1 text-sm font-medium text-indigo-300">by Korvo Ecossistema</p>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-2xl">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => { setMode('login'); setError(''); setMessage('') }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setMessage('') }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${mode === 'register' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Seu nome completo</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex.: Maria Silva"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            {message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar no PlayDrop' : 'Criar minha conta'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            Revenda camisetas estampadas sem estoque. A PlayDrop envia direto ao seu cliente.
          </p>
        </div>
      </div>
    </div>
  )
}
