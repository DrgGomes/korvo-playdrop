'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL } from '@/lib/utils'
import { Plus, Pencil, Trash2, Shirt, ShieldAlert, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const EMPTY = {
  name: '',
  category: '',
  base_cost: '',
  suggested_price: '',
  colors: '',
  sizes: '',
  image_url: '',
  description: '',
  active: true,
}

export default function AdminProductsPage() {
  const [isAdmin, setIsAdmin] = useState(null)
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    setIsAdmin(profile?.role === 'admin')

    if (profile?.role === 'admin') {
      const { data } = await supabase.from('products').select('*').order('name')
      setProducts(data ?? [])
    }
  }

  function openNew() {
    setEditingId(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  function openEdit(p) {
    setEditingId(p.id)
    setForm({
      name: p.name || '',
      category: p.category || '',
      base_cost: p.base_cost ?? '',
      suggested_price: p.suggested_price ?? '',
      colors: p.colors?.join(', ') || '',
      sizes: p.sizes?.join(', ') || '',
      image_url: p.image_url || '',
      description: p.description || '',
      active: p.active,
    })
    setShowForm(true)
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)

    const payload = {
      name: form.name,
      category: form.category || null,
      base_cost: Number(form.base_cost || 0),
      suggested_price: form.suggested_price ? Number(form.suggested_price) : null,
      colors: form.colors ? form.colors.split(',').map((s) => s.trim()).filter(Boolean) : [],
      sizes: form.sizes ? form.sizes.split(',').map((s) => s.trim()).filter(Boolean) : [],
      image_url: form.image_url || null,
      description: form.description || null,
      active: form.active,
    }

    if (editingId) {
      await supabase.from('products').update(payload).eq('id', editingId)
    } else {
      await supabase.from('products').insert(payload)
    }

    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY)
    load()
  }

  async function toggleActive(p) {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    load()
  }

  async function remove(p) {
    if (!window.confirm(`Excluir "${p.name}"? Essa ação não pode ser desfeita.`)) return
    await supabase.from('products').delete().eq('id', p.id)
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
        <p className="mt-2 text-sm text-slate-500">Apenas administradores do ecossistema Korvo podem gerenciar o catálogo.</p>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
          >
            <ArrowLeft size={15} /> Voltar ao Admin
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Catálogo — Produtos</h1>
          <p className="mt-1 text-sm text-slate-500">Cadastre as camisetas que os revendedores vão anunciar.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Plus size={16} /> Novo produto
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-bold text-slate-900">{editingId ? 'Editar produto' : 'Novo produto'}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>Nome do produto *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Camiseta Estampada Leão DTF"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Categoria</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex.: Animal, Frases, Geek..."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Custo da peça (R$) *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.base_cost}
                onChange={(e) => setForm({ ...form, base_cost: e.target.value })}
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Preço sugerido (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.suggested_price}
                onChange={(e) => setForm({ ...form, suggested_price: e.target.value })}
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>URL da foto</label>
              <input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Cores (separadas por vírgula)</label>
              <input
                value={form.colors}
                onChange={(e) => setForm({ ...form, colors: e.target.value })}
                placeholder="Branca, Preta, Vermelha"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Tamanhos (separados por vírgula)</label>
              <input
                value={form.sizes}
                onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                placeholder="P, M, G, GG"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Descrição / kit de anúncio</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Características da camiseta, tecido, cuidados..."
                className={inputClass}
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              Visível para os revendedores
            </label>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar produto'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {products.length === 0 && !showForm ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Shirt size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Nenhum produto cadastrado</h2>
          <p className="mt-1 text-sm text-slate-500">Clique em "Novo produto" para adicionar sua primeira camiseta.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">Produto</th>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3">Custo</th>
                  <th className="px-6 py-3">Sugerido</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <Shirt size={18} />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-400">
                            {p.colors?.length ? `${p.colors.length} cores · ` : ''}
                            {p.sizes?.length ? `${p.sizes.length} tamanhos` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{p.category || '—'}</td>
                    <td className="px-6 py-3">{formatBRL(p.base_cost)}</td>
                    <td className="px-6 py-3">{formatBRL(p.suggested_price)}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => toggleActive(p)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                          p.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                        }`}
                      >
                        {p.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                          aria-label="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => remove(p)}
                          className="rounded-lg border border-slate-200 p-2 text-red-500 transition hover:bg-red-50"
                          aria-label="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
