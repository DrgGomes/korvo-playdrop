'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/utils'
import { User, Save, LogOut, ShieldCheck, Store, BadgeCheck } from 'lucide-react'

export default function ContaPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', cpf_cnpj: '', phone: '' })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setEmail(user.email || '')

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (data) {
      setProfile(data)
      setForm({
        full_name: data.full_name || user.user_metadata?.full_name || '',
        cpf_cnpj: data.cpf_cnpj || '',
        phone: data.phone || '',
      })
    }
    setLoading(false)
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Sessão expirada. Entre novamente.')
      setSaving(false)
      return
    }

    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        cpf_cnpj: form.cpf_cnpj.trim() || null,
        phone: form.phone.trim() || null,
      })
      .eq('id', user.id)

    if (err) {
      setError('Não foi possível salvar suas informações. Tente novamente.')
      setSaving(false)
      return
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    load()
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-500'
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700'

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando seus dados...</p>
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Minha conta</h1>
        <p className="mt-1 text-sm text-slate-500">
          Seus dados cadastrais na PlayDrop, lidos direto da sua conta.
        </p>
      </div>

      {/* Cartão do perfil */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-extrabold text-white">
            {(form.full_name || 'P')[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900">{form.full_name || 'Revendedor'}</p>
            <p className="text-sm text-slate-500">{email}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                <Store size={12} /> {isAdmin ? 'Admin do ecossistema Korvo' : 'Revendedor'}
              </span>
              {profile?.status === 'ativo' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                  <BadgeCheck size={12} /> Ativo
                </span>
              )}
            </div>
          </div>
        </div>

        {profile?.created_at && (
          <p className="mt-4 text-xs text-slate-400">
            Conta criada em {formatDate(profile.created_at)}
          </p>
        )}
      </div>

      {/* Formulário */}
      <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
          <User size={18} className="text-indigo-600" />
          Dados cadastrais
        </h2>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nome completo</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Seu nome"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>E-mail (login)</label>
            <input value={email} disabled className={inputClass} />
            <p className="mt-1 text-xs text-slate-400">
              O e-mail é usado para entrar na plataforma. Para trocá-lo, fale com o suporte.
            </p>
          </div>

          <div>
            <label className={labelClass}>CPF ou CNPJ</label>
            <input
              value={form.cpf_cnpj}
              onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Telefone / WhatsApp</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className={inputClass}
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {saved && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Informações salvas com sucesso. ✅
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>

      {/* Segurança */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
          <ShieldCheck size={18} className="text-emerald-600" />
          Segurança
        </h2>
        <p className="text-sm text-slate-500">
          Para trocar sua senha, use a opção "Esqueci minha senha" na tela de login — o Supabase
          envia um e-mail de redefinição para você.
        </p>
        <button
          onClick={logout}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={15} /> Sair da conta
        </button>
      </div>
    </div>
  )
}
