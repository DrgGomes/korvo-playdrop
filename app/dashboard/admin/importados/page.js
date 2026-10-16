'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, ShieldAlert, Inbox, CheckCircle2, Trash2, RefreshCw, RotateCcw } from 'lucide-react'
import Link from 'next/link'

function formatBRL(v) {
  if (v == null) return '—'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const ABAS = [
  ['pending', 'Pendentes'],
  ['approved', 'Aprovados'],
  ['discarded', 'Descartados'],
]

export default function ImportadosPage() {
  const [isAdmin, setIsAdmin] = useState(null)
  const [itens, setItens] = useState([])
  const [aba, setAba] = useState('pending')
  const [sel, setSel] = useState([])
  const [processando, setProcessando] = useState(false)
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    setIsAdmin(profile?.role === 'admin')
    if (profile?.role === 'admin') {
      const { data } = await supabase
        .from('imported_products')
        .select('*')
        .order('created_at', { ascending: false })
      setItens(data ?? [])
      setSel([])
    }
  }

  const visiveis = itens.filter((i) => i.status === aba)
  const selecionados = visiveis.filter((i) => sel.includes(i.id))

  function toggleSel(id) {
    setSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function aprovarSelecionados() {
    if (selecionados.length === 0) return
    if (!window.confirm(`Cadastrar ${selecionados.length} produto(s) no catálogo?`)) return
    setProcessando(true)
    let criados = 0
    const falhas = []
    for (const p of selecionados) {
      const { data: novo, error } = await supabase
        .from('products')
        .insert({
          name: p.title,
          description: p.description || null,
          category: null,
          base_cost: 0,
          suggested_price: p.price ?? null,
          colors: [],
          sizes: p.sizes || [],
          image_url: (p.photos && p.photos[0]) || null,
          active: true,
          exibir_landing: false,
        })
        .select()
        .single()
      if (error || !novo) {
        falhas.push(p.title)
        continue
      }
      criados++
      const fotos = (p.photos || []).slice(0, 8)
      if (fotos.length > 0) {
        await supabase
          .from('product_images')
          .insert(fotos.map((url, i) => ({ product_id: novo.id, image_url: url, sort_order: i })))
      }
      await supabase.from('imported_products').update({ status: 'approved' }).eq('id', p.id)
    }
    setProcessando(false)
    setAviso({
      tipo: 'ok',
      texto: `${criados} produto(s) cadastrado(s) no catálogo!` + (falhas.length ? ` ${falhas.length} falha(s).` : ''),
    })
    load()
  }

  async function descartar(item) {
    if (!window.confirm(`Descartar "${item.title}"?`)) return
    await supabase.from('imported_products').update({ status: 'discarded' }).eq('id', item.id)
    load()
  }

  async function reativar(item) {
    await supabase.from('imported_products').update({ status: 'pending' }).eq('id', item.id)
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
        <p className="mt-2 text-sm text-slate-500">Apenas administradores podem gerenciar os importados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/produtos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft size={15} /> Voltar aos produtos
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <Inbox size={22} className="text-indigo-600" /> Importados
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Produtos capturados pela extensão. Aprove os que devem entrar no catálogo.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {ABAS.map(([valor, label]) => {
            const qtd = itens.filter((i) => i.status === valor).length
            return (
              <button
                key={valor}
                onClick={() => { setAba(valor); setSel([]) }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  aba === valor
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label} ({qtd})
              </button>
            )
          })}
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {aviso && (
        <div className={`rounded-xl px-4 py-3 text-sm ${aviso.tipo === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700'}`}>
          {aviso.texto}
        </div>
      )}

      {aba === 'pending' && visiveis.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-4">
          <p className="text-sm text-slate-600">
            <strong>{selecionados.length}</strong> selecionado(s) de {visiveis.length} pendente(s)
          </p>
          <button
            onClick={aprovarSelecionados}
            disabled={processando || selecionados.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <CheckCircle2 size={16} /> {processando ? 'Cadastrando...' : `Aprovar ${selecionados.length} para o catálogo`}
          </button>
        </div>
      )}

      {visiveis.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Inbox size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            {aba === 'pending' ? 'Nenhum produto pendente' : aba === 'approved' ? 'Nenhum aprovado ainda' : 'Nenhum descartado'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {aba === 'pending'
              ? 'Abra a busca do Mercado Livre, Shopee ou TikTok Shop e clique em "⬇ Importar" nos anúncios.'
              : 'Os produtos desta lista aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  {aba === 'pending' && <th className="px-4 py-3">✓</th>}
                  <th className="px-4 py-3">Foto</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Dados</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0">
                    {aba === 'pending' && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={sel.includes(p.id)}
                          onChange={() => toggleSel(p.id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {p.photos?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photos[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-slate-100" />
                      )}
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 hover:text-indigo-600">
                        {p.title}
                      </a>
                      <p className="truncate text-xs text-slate-400">{p.description || 'sem descrição'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.source_site}</td>
                    <td className="px-4 py-3">{formatBRL(p.price)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {p.photos?.length || 0} foto(s) · {p.sizes?.length || 0} tamanho(s)
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {aba === 'pending' && (
                          <button
                            onClick={() => descartar(p)}
                            className="rounded-lg border border-slate-200 p-2 text-red-500 transition hover:bg-red-50"
                            aria-label="Descartar"
                            title="Descartar"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        {aba === 'discarded' && (
                          <button
                            onClick={() => reativar(p)}
                            className="rounded-lg border border-slate-200 p-2 text-indigo-600 transition hover:bg-indigo-50"
                            aria-label="Reativar"
                            title="Voltar para pendentes"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
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
