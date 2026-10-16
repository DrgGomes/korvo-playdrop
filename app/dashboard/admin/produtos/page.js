'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatBRL } from '@/lib/utils'
import { Plus, Pencil, Trash2, Shirt, ShieldAlert, ArrowLeft, X, ImagePlus, Copy, Search, Globe, RotateCcw, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
const EMPTY = {
  name: '',
  sku: '',
  category: '',
  suggested_price: '',
  description: '',
  active: true,
  exibir_landing: false,
}
export default function AdminProductsPage() {
  const [isAdmin, setIsAdmin] = useState(null)
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [colors, setColors] = useState([])
  const [sizes, setSizes] = useState([])
  const [costComponents, setCostComponents] = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [selectedSizes, setSelectedSizes] = useState([])
  const [images, setImages] = useState([])
  const [imageInput, setImageInput] = useState('')
  const [costs, setCosts] = useState([])
  // ===== Filtros da lista =====
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [landingFilter, setLandingFilter] = useState('todos')
  // ===== Visualizador de fotos (lightbox) =====
  const [lightbox, setLightbox] = useState(null) // { titulo, fotos, idx }
  // ===== Botão IA da descrição =====
  const [iaRodando, setIaRodando] = useState(false)
  useEffect(() => {
    load()
  }, [])
  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    setIsAdmin(profile?.role === 'admin')
    if (profile?.role === 'admin') {
      const [p, c, s, cc] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('colors').select('*').order('name'),
        supabase.from('sizes').select('*').order('sort_order'),
        supabase.from('cost_components').select('*').order('created_at'),
      ])
      setProducts(p.data ?? [])
      setColors(c.data ?? [])
      setSizes(s.data ?? [])
      setCostComponents(cc.data ?? [])
    }
  }
  // Categorias únicas existentes no catálogo (pro filtro)
  const categorias = [...new Set(products.map((p) => p.category).filter(Boolean))].sort()
  // Lista filtrada: busca + categoria + landing
  const filtered = products.filter((p) => {
    const nome = (p.name || '').toLowerCase()
    const cat = (p.category || '').toLowerCase()
    const sku = (p.sku || '').toLowerCase()
    const termo = search.trim().toLowerCase()
    if (termo && !nome.includes(termo) && !cat.includes(termo) && !sku.includes(termo)) return false
    if (categoryFilter !== 'todas' && (p.category || '') !== categoryFilter) return false
    if (landingFilter === 'na_landing' && !p.exibir_landing) return false
    if (landingFilter === 'fora_landing' && p.exibir_landing) return false
    return true
  })
  function openNew() {
    setEditingId(null)
    setForm(EMPTY)
    setSelectedColors([])
    setSelectedSizes([])
    setImages([])
    setImageInput('')
    setCosts(costComponents.map((c) => ({ component_id: c.id, name: c.name, amount: Number(c.default_amount || 0) })))
    setShowForm(true)
  }
  // ===== Carrega fotos e custos salvos ao editar =====
  async function openEdit(p) {
    setEditingId(p.id)
    setForm({
      name: p.name || '',
      sku: p.sku || '',
      category: p.category || '',
      suggested_price: p.suggested_price ?? '',
      description: p.description || '',
      active: p.active,
      exibir_landing: p.exibir_landing || false,
    })
    setSelectedColors(p.colors || [])
    setSelectedSizes(p.sizes || [])
    const { data: imgs } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', p.id)
      .order('sort_order')
    setImages((imgs ?? []).map((i) => i.image_url))
    setImageInput('')
    const { data: costRows } = await supabase
      .from('product_cost_items')
      .select('component_id, component_name, amount')
      .eq('product_id', p.id)
    setCosts((costRows ?? []).map((c) => ({
      component_id: c.component_id,
      name: c.component_name,
      amount: Number(c.amount || 0),
    })))
    setShowForm(true)
  }
  // ===== Abre a galeria completa do produto no visualizador =====
  async function abrirGaleria(p) {
    const { data: imgs } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', p.id)
      .order('sort_order')
    const fotos = (imgs ?? []).map((i) => i.image_url).filter(Boolean)
    setLightbox({
      titulo: p.name,
      fotos: fotos.length > 0 ? fotos : [p.image_url].filter(Boolean),
      idx: 0,
    })
  }
  // ===== DUPLICAR: copia produto + fotos + custos =====
  async function duplicate(p) {
    if (!window.confirm(`Duplicar "${p.name}"? Uma cópia será criada com o nome "${p.name} (cópia)".`)) return
    const { data: novo, error } = await supabase
      .from('products')
      .insert({
        name: `${p.name} (cópia)`,
        category: p.category,
        base_cost: p.base_cost,
        suggested_price: p.suggested_price,
        colors: p.colors,
        sizes: p.sizes,
        image_url: p.image_url,
        sku: null, // cópia nasce sem SKU para você definir um novo
        description: p.description,
        active: false, // cópia nasce inativa por segurança
        exibir_landing: false,
      })
      .select()
      .single()
    if (error || !novo) {
      window.alert('Erro ao duplicar: ' + (error?.message || 'tente novamente'))
      return
    }
    // Copia as fotos da galeria
    const { data: imgs } = await supabase
      .from('product_images')
      .select('image_url, sort_order')
      .eq('product_id', p.id)
      .order('sort_order')
    if (imgs && imgs.length > 0) {
      await supabase.from('product_images').insert(
        imgs.map((i) => ({ product_id: novo.id, image_url: i.image_url, sort_order: i.sort_order }))
      )
    }
    // Copia os custos detalhados
    const { data: costRows } = await supabase
      .from('product_cost_items')
      .select('component_id, component_name, amount')
      .eq('product_id', p.id)
    if (costRows && costRows.length > 0) {
      await supabase.from('product_cost_items').insert(
        costRows.map((c) => ({ product_id: novo.id, component_id: c.component_id, component_name: c.component_name, amount: c.amount }))
      )
    }
    load()
  }
  // ===== TOGGLE LANDING: mostra/esconde na vitrine pública =====
  async function toggleLanding(p) {
    await supabase.from('products').update({ exibir_landing: !p.exibir_landing }).eq('id', p.id)
    load()
  }
  function toggleColor(name) {
    setSelectedColors((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    )
  }
  function toggleSize(name) {
    setSelectedSizes((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    )
  }
  function addImage() {
    const url = imageInput.trim()
    if (!url) return
    setImages((prev) => [...prev, url])
    setImageInput('')
  }
  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }
  function setCostAmount(id, value) {
    setCosts((prev) => prev.map((c) => (c.component_id === id ? { ...c, amount: Number(value || 0) } : c)))
  }
  function toggleCost(id) {
    setCosts((prev) => {
      const exists = prev.find((c) => c.component_id === id)
      if (exists) return prev.filter((c) => c.component_id !== id)
      const comp = costComponents.find((c) => c.id === id)
      return [...prev, { component_id: id, name: comp.name, amount: Number(comp.default_amount || 0) }]
    })
  }
  const totalCost = costs.reduce((s, c) => s + Number(c.amount || 0), 0)
  // ===== IA: reescreve a descrição no padrão do Mercado Livre =====
  async function melhorarComIa() {
    if (!form.description.trim()) {
      window.alert('Escreva ou cole a descrição atual primeiro — a IA reescreve a partir dela.')
      return
    }
    setIaRodando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/rewrite-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: 'Bearer ' + session.access_token } : {}),
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          sizes: selectedSizes,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        window.alert('A IA não conseguiu reescrever agora: ' + (data.error || 'tente novamente em instantes'))
      } else {
        setForm((f) => ({ ...f, description: data.description }))
      }
    } catch (e) {
      window.alert('Falha de conexão com a IA. Tente novamente.')
    }
    setIaRodando(false)
  }
  async function save(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      sku: form.sku ? form.sku.trim() : null,
      category: form.category || null,
      base_cost: totalCost,
      suggested_price: form.suggested_price ? Number(form.suggested_price) : null,
      colors: selectedColors,
      sizes: selectedSizes,
      image_url: images[0] || null,
      description: form.description || null,
      active: form.active,
      exibir_landing: form.exibir_landing,
    }
    let productId = editingId
    if (editingId) {
      await supabase.from('products').update(payload).eq('id', editingId)
      await supabase.from('product_images').delete().eq('product_id', editingId)
      await supabase.from('product_cost_items').delete().eq('product_id', editingId)
    } else {
      const { data } = await supabase.from('products').insert(payload).select().single()
      productId = data.id
    }
    if (images.length > 0) {
      const imgRows = images.map((url, i) => ({ product_id: productId, image_url: url, sort_order: i }))
      await supabase.from('product_images').insert(imgRows)
    }
    if (costs.length > 0) {
      const costRows = costs.map((c) => ({
        product_id: productId,
        component_id: c.component_id,
        component_name: c.name,
        amount: Number(c.amount || 0),
      }))
      await supabase.from('product_cost_items').insert(costRows)
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
  const chipActive = 'bg-indigo-600 text-white border-indigo-600'
  const chipIdle = 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
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
      {/* ===== BARRA DE FILTROS ===== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus-within:border-indigo-500 focus-within:bg-white">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, SKU ou categoria..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={landingFilter}
            onChange={(e) => setLandingFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="todos">Todos</option>
            <option value="na_landing">Na landing page</option>
            <option value="fora_landing">Fora da landing</option>
          </select>
          {(search || categoryFilter !== 'todas' || landingFilter !== 'todos') && (
            <button
              onClick={() => { setSearch(''); setCategoryFilter('todas'); setLandingFilter('todos') }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <RotateCcw size={14} /> Limpar
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {filtered.length} de {products.length} produto(s) exibido(s)
        </p>
      </div>
      {showForm && (
        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 font-bold text-slate-900">{editingId ? 'Editar produto' : 'Novo produto'}</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
              <label className={labelClass}>SKU (código interno)</label>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="Ex.: CAM-LEAO-01"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Preço sugerido de venda (R$)</label>
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
            <div className="md:col-span-2">
              <label className={labelClass}>Cores (clique para selecionar)</label>
              {colors.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma cor cadastrada. Adicione em Admin → Configurações.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleColor(c.name)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        selectedColors.includes(c.name) ? chipActive : chipIdle
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              {selectedColors.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">Selecionadas: {selectedColors.join(', ')}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Tamanhos (clique para selecionar)</label>
              {sizes.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum tamanho cadastrado. Adicione em Admin → Configurações.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSize(s.name)}
                      className={`rounded-xl border px-4 py-1.5 text-sm font-semibold transition ${
                        selectedSizes.includes(s.name) ? chipActive : chipIdle
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              {selectedSizes.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">Selecionados: {selectedSizes.join(', ')}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Custos do produto (selecione os que entram)</label>
              {costComponents.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum custo cadastrado. Adicione em Admin → Configurações.</p>
              ) : (
                <div className="space-y-2">
                  {costComponents.map((comp) => {
                    const selected = costs.find((c) => c.component_id === comp.id)
                    return (
                      <div
                        key={comp.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                          selected ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => toggleCost(comp.id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                        />
                        <span className="flex-1 text-sm font-medium text-slate-800">{comp.name}</span>
                        {selected && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={selected.amount}
                              onChange={(e) => setCostAmount(comp.id, e.target.value)}
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-600">Custo total do produto</span>
                <span className="text-lg font-extrabold text-indigo-700">{formatBRL(totalCost)}</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Fotos do produto (várias)</label>
              <div className="flex gap-2">
                <input
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="Cole a URL da foto e clique em Adicionar"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  <ImagePlus size={15} /> Adicionar
                </button>
              </div>
              {images.length === 0 ? (
                <p className="mt-2 text-xs text-slate-400">Nenhuma foto adicionada. A primeira foto é a capa do produto.</p>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((url, idx) => (
                    <div key={idx} className="group relative overflow-hidden rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setLightbox({ titulo: `Foto ${idx + 1}`, fotos: images, idx })}
                        className="block w-full cursor-zoom-in"
                        aria-label="Ampliar foto"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto ${idx + 1}`} className="h-24 w-full object-cover" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          Capa
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-red-600"
                        aria-label="Remover foto"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <div className="mb-1 flex items-center justify-between gap-3">
                <label className={labelClass}>Descrição / kit de anúncio</label>
                <button
                  type="button"
                  onClick={melhorarComIa}
                  disabled={iaRodando}
                  title="A IA reescreve no padrão do Mercado Livre (intro, características, tabela de medidas e garantia)"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  <Sparkles size={13} /> {iaRodando ? 'Gerando...' : 'Melhorar com IA'}
                </button>
              </div>
              <textarea
                rows={8}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Características da camiseta, tecido, cuidados..."
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-400">
                A IA reescreve no padrão do Mercado Livre: explicativo curto, características, tabela de medidas e garantia de 30 dias. Revise o resultado antes de salvar.
              </p>
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
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.exibir_landing}
                onChange={(e) => setForm({ ...form, exibir_landing: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <Globe size={15} className="shrink-0 text-indigo-600" />
              Exibir na landing page pública
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
      {filtered.length === 0 && !showForm ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Shirt size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            {products.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {products.length === 0
              ? 'Clique em "Novo produto" para adicionar sua primeira camiseta.'
              : 'Tente ajustar a busca ou limpar os filtros.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3">Produto</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3">Custo</th>
                  <th className="px-6 py-3">Sugerido</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Landing</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <button
                            type="button"
                            onClick={() => abrirGaleria(p)}
                            title="Ver fotos em tamanho grande"
                            className="shrink-0 cursor-zoom-in"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="h-16 w-16 rounded-xl object-cover transition hover:scale-105"
                            />
                          </button>
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                            <Shirt size={20} />
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
                    <td className="px-6 py-3 text-xs text-slate-500">{p.sku || '—'}</td>
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
                      <button
                        onClick={() => toggleLanding(p)}
                        title={p.exibir_landing ? 'Clique para remover da landing' : 'Clique para exibir na landing'}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                          p.exibir_landing
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                        }`}
                      >
                        <Globe size={12} />
                        {p.exibir_landing ? 'Na landing' : 'Oculta'}
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
                          onClick={() => duplicate(p)}
                          className="rounded-lg border border-slate-200 p-2 text-indigo-600 transition hover:bg-indigo-50"
                          aria-label="Duplicar"
                          title="Duplicar produto"
                        >
                          <Copy size={15} />
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
      {/* ===== VISUALIZADOR DE FOTOS (lightbox) ===== */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
          <div
            className="relative flex max-h-full flex-col items-center gap-3 px-10"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.fotos.length > 1 && (
              <button
                type="button"
                onClick={() => setLightbox((l) => ({ ...l, idx: (l.idx - 1 + l.fotos.length) % l.fotos.length }))}
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                aria-label="Foto anterior"
              >
                <ChevronLeft size={22} />
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.fotos[lightbox.idx]}
              alt={lightbox.titulo}
              className="max-h-[78vh] max-w-full rounded-2xl object-contain"
            />
            {lightbox.fotos.length > 1 && (
              <button
                type="button"
                onClick={() => setLightbox((l) => ({ ...l, idx: (l.idx + 1) % l.fotos.length }))}
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                aria-label="Próxima foto"
              >
                <ChevronRight size={22} />
              </button>
            )}
            <p className="text-center text-sm font-medium text-white">
              {lightbox.titulo}
              {lightbox.fotos.length > 1 ? ` · ${lightbox.idx + 1} de ${lightbox.fotos.length}` : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
