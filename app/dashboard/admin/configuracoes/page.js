'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL } from '@/lib/utils'
import { Settings, Plus, Trash2, Pencil, ShieldAlert, ArrowLeft, Check } from 'lucide-react'

export default function ConfiguracoesPage() {
  const [isAdmin, setIsAdmin] = useState(null)
  const [tab, setTab] = useState('custos')

  const [costs, setCosts] = useState([])
  const [colors, setColors] = useState([])
  const [sizes, setSizes] = useState([])

  const [newCost, setNewCost] = useState({ name: '', amount: '' })
  const [newColor, setNewColor] = useState('')
  const [newSize, setNewSize] = useState('')

  const [editingCost, setEditingCost] = useState(null)
  const [editingColor, setEditingColor] = useState(null)
  const [editingSize, setEditingSize] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    setIsAdmin(profile?.role === 'admin')

    if (profile?.role === 'admin') {
      const [c, col, s] = await Promise.all([
        supabase.from('cost_components').select('*').order('created_at'),
        supabase.from('colors').select('*').order('name'),
        supabase.from('sizes').select('*').order('sort_order'),
      ])
      setCosts(c.data ?? [])
      setColors(col.data ?? [])
      setSizes(s.data ?? [])
    }
  }

  // ---------- CUSTOS ----------
  async function addCost(e) {
    e.preventDefault()
    if (!newCost.name.trim()) return
    await supabase.from('cost_components').insert({
      name: newCost.name.trim(),
      default_amount: Number(newCost.amount || 0),
    })
    setNewCost({ name: '', amount: '' })
    load()
  }

  async function saveCost(id) {
    const c = costs.find((x) => x.id === id)
    await supabase.from('cost_components').update({
      name: c.name,
      default_amount: Number(c.default_amount || 0),
    }).eq('id', id)
    setEditingCost(null)
    load()
  }

  async function removeCost(id) {
    await supabase.from('cost_components').delete().eq('id', id)
    load()
  }

  // ---------- CORES ----------
  async function addColor(e) {
    e.preventDefault()
    if (!newColor.trim()) return
    await supabase.from('colors').insert({ name: newColor.trim() })
    setNewColor('')
    load()
  }

  async function saveColor(id) {
    const c = colors.find((x) => x.id === id)
    await supabase.from('colors').update({ name: c.name }).eq('id', id)
    setEditingColor(null)
    load()
  }

  async function removeColor(id) {
    await supabase.from('colors').delete().eq('id', id)
    load()
  }

  // ---------- TAMANHOS ----------
  async function addSize(e) {
    e.preventDefault()
    if (!newSize.trim()) return
    const nextOrder = sizes.length + 1
    await supabase.from('sizes').insert({ name: newSize.trim(), sort_order: nextOrder })
    setNewSize('')
    load()
  }

  async function saveSize(id) {
    const s = sizes.find((x) => x.id === id)
    await supabase.from('sizes').update({ name: s.name }).eq('id', id)
    setEditingSize(null)
    load()
  }

  async function removeSize(id) {
    await supabase.from('sizes').delete().eq('id', id)
    load()
  }

  if (isAdmin === null) {
    return <p className="text-sm text-slate-400">Verificando acesso...</p>
  }

  if (isAdmin === false) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <ShieldAlert size={26} />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-slate-900">Acesso restrito</h1>
        <p className="mt-2 text-sm text-slate-500">Apenas administradores do ecossistema Korvo podem acessar as configurações.</p>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700'

  const tabs = [
    { v: 'custos', l: 'Custos' },
    { v: 'cores', l: 'Cores' },
    { v: 'tamanhos', l: 'Tamanhos' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft size={15} /> Voltar ao Admin
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <Settings size={22} className="text-indigo-600" /> Configurações
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Cadastre os custos padrão, cores e tamanhos que vão aparecer no cadastro de produtos.
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.v ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* ===== CUSTOS ===== */}
      {tab === 'custos' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 font-bold text-slate-900">Componentes de custo</h2>
          <p className="mb-4 text-sm text-slate-500">
            Ex.: Camiseta, Embalagem, DTF, Etiqueta... O valor padrão é só uma sugestão — no produto você ajusta cada um.
          </p>

          <form onSubmit={addCost} className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_auto]">
            <div>
              <label className={labelClass}>Nome do custo</label>
              <input
                value={newCost.name}
                onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                placeholder="Ex.: Camiseta, Embalagem, DTF..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Valor padrão (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newCost.amount}
                onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <Plus size={15} /> Adicionar
              </button>
            </div>
          </form>

          {costs.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum custo cadastrado ainda.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {costs.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-3">
                  {editingCost === c.id ? (
                    <>
                      <input
                        value={c.name}
                        onChange={(e) => setCosts(costs.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))}
                        className={`${inputClass} flex-1`}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={c.default_amount}
                        onChange={(e) => setCosts(costs.map((x) => (x.id === c.id ? { ...x, default_amount: e.target.value } : x)))}
                        className={`${inputClass} w-28`}
                      />
                      <button onClick={() => saveCost(c.id)} className="rounded-lg bg-emerald-600 p-2 text-white" aria-label="Salvar">
                        <Check size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-400">Padrão: {formatBRL(c.default_amount)}</p>
                      </div>
                      <button onClick={() => setEditingCost(c.id)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" aria-label="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => removeCost(c.id)} className="rounded-lg border border-slate-200 p-2 text-red-500 hover:bg-red-50" aria-label="Excluir">
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== CORES ===== */}
      {tab === 'cores' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 font-bold text-slate-900">Cores padrão</h2>
          <p className="mb-4 text-sm text-slate-500">Essas cores aparecem como cliques rápidos no cadastro de produto.</p>

          <form onSubmit={addColor} className="mb-4 flex items-end gap-3">
            <div className="flex-1">
              <label className={labelClass}>Nova cor</label>
              <input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="Ex.: Rosa, Azul Marinho..."
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <Plus size={15} /> Adicionar
            </button>
          </form>

          {colors.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma cor cadastrada.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {colors.map((c) =>
                editingColor === c.id ? (
                  <div key={c.id} className="flex items-center gap-1">
                    <input
                      value={c.name}
                      onChange={(e) => setColors(colors.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))}
                      className={`${inputClass} w-32`}
                    />
                    <button onClick={() => saveColor(c.id)} className="rounded-lg bg-emerald-600 p-2 text-white" aria-label="Salvar">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <span key={c.id} className="group inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                    {c.name}
                    <button onClick={() => setEditingColor(c.id)} className="text-slate-400 hover:text-indigo-600" aria-label="Editar">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => removeColor(c.id)} className="text-slate-400 hover:text-red-500" aria-label="Excluir">
                      <Trash2 size={13} />
                    </button>
                  </span>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== TAMANHOS ===== */}
      {tab === 'tamanhos' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 font-bold text-slate-900">Tamanhos padrão</h2>
          <p className="mb-4 text-sm text-slate-500">Esses tamanhos aparecem como cliques rápidos no cadastro de produto.</p>

          <form onSubmit={addSize} className="mb-4 flex items-end gap-3">
            <div className="flex-1">
              <label className={labelClass}>Novo tamanho</label>
              <input
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="Ex.: XG, XGG..."
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <Plus size={15} /> Adicionar
            </button>
          </form>

          {sizes.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum tamanho cadastrado.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) =>
                editingSize === s.id ? (
                  <div key={s.id} className="flex items-center gap-1">
                    <input
                      value={s.name}
                      onChange={(e) => setSizes(sizes.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))}
                      className={`${inputClass} w-24`}
                    />
                    <button onClick={() => saveSize(s.id)} className="rounded-lg bg-emerald-600 p-2 text-white" aria-label="Salvar">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <span key={s.id} className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700">
                    {s.name}
                    <button onClick={() => setEditingSize(s.id)} className="text-slate-400 hover:text-indigo-600" aria-label="Editar">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => removeSize(s.id)} className="text-slate-400 hover:text-red-500" aria-label="Excluir">
                      <Trash2 size={13} />
                    </button>
                  </span>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
