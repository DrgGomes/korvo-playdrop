'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Database, Download, Upload, CheckCircle, XCircle, Loader2, ShieldAlert } from 'lucide-react'

// Todas as tabelas do sistema — na ordem correta pra restaurar
const TABELAS = [
  'profiles',
  'colors',
  'sizes',
  'products',
  'product_images',
  'cost_components',
  'product_cost_items',
  'payments',
  'orders',
  'order_items',
  'order_attachments',
  'returns',
  'cart_items',
  'banners',
  'notices',
  'announcements',
  'activities',
]

// Tabelas que NÃO entram na restauração pela tela:
// - profiles: protegida por RLS (cada um edita só o próprio) e as contas
//   de login vivem no Auth do Supabase, fora do backup de dados
const TABELAS_SEM_RESTORE = ['profiles']

export default function AdminBackupPage() {
  const [exporting, setExporting] = useState(false)
  const [exportMsg, setExportMsg] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState(null)

  // ===== EXPORTAR: baixa um JSON com todas as tabelas =====
  async function exportarBackup() {
    setExporting(true)
    setExportMsg(null)

    const backup = { _meta: { sistema: 'PlayDrop', versao: 1, data: new Date().toISOString() } }
    let ok = true

    for (const tabela of TABELAS) {
      const { data, error } = await supabase.from(tabela).select('*')
      if (error) {
        ok = false
        setExportMsg({ ok: false, text: `Erro ao ler "${tabela}": ${error.message}` })
        break
      }
      backup[tabela] = data ?? []
    }

    if (ok) {
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const hoje = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `playdrop-backup-${hoje}.json`
      a.click()
      URL.revokeObjectURL(url)
      const total = TABELAS.reduce((s, t) => s + (backup[t]?.length || 0), 0)
      setExportMsg({ ok: true, text: `Backup gerado! ${total} registros baixados do sistema.` })
    }

    setExporting(false)
  }

  // ===== IMPORTAR: lê o JSON e repõe os dados =====
  async function importarBackup(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!window.confirm('ATENÇÃO: a restauração vai SOBRESCREVER os dados atuais do sistema com os do arquivo. Continuar?')) return

    setImporting(true)
    setImportMsg(null)

    try {
      const texto = await file.text()
      const backup = JSON.parse(texto)

      if (!backup._meta || backup._meta.sistema !== 'PlayDrop') {
        setImportMsg({ ok: false, text: 'Arquivo inválido — não é um backup do PlayDrop.' })
        setImporting(false)
        return
      }

      let inseridos = 0

      let puladas = []
      for (const tabela of TABELAS) {
        const linhas = backup[tabela]
        if (!Array.isArray(linhas) || linhas.length === 0) continue
        if (TABELAS_SEM_RESTORE.includes(tabela)) {
          puladas.push(tabela)
          continue
        }

        // Estratégia segura: upsert linha a linha em lotes
        for (let i = 0; i < linhas.length; i += 500) {
          const lote = linhas.slice(i, i + 500)
          const { error } = await supabase.from(tabela).upsert(lote)
          if (error) {
            setImportMsg({ ok: false, text: `Erro ao restaurar "${tabela}": ${error.message}` })
            setImporting(false)
            return
          }
          inseridos += lote.length
        }
      }

      setImportMsg({ ok: true, text: `Restauração concluída! ${inseridos} registros repostos.` })
    } catch (err) {
      setImportMsg({ ok: false, text: 'Arquivo corrompido ou ilegível.' })
    }

    setImporting(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Backup do sistema</h1>
        <p className="mt-1 text-sm text-slate-500">
          Baixe todos os dados do banco em um arquivo e guarde no seu PC. Faça isso todo dia ou sempre que movimentar muito o sistema.
        </p>
      </div>

      {/* Exportar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Download size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-900">Baixar backup completo</h2>
            <p className="mt-1 text-sm text-slate-500">
              Gera um arquivo <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.json</code> com
              clientes, pedidos, itens, produtos, carrinho, banners, avisos e notificações.
              Guarde numa pasta organizada (ex.: <b>PlayDrop/Backups/</b> no Drive).
            </p>
            <button
              onClick={exportarBackup}
              disabled={exporting}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
              {exporting ? 'Gerando backup...' : 'Baixar backup agora'}
            </button>
            {exportMsg && (
              <div className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                exportMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}>
                {exportMsg.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {exportMsg.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Importar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Upload size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-900">Restaurar de um backup</h2>
            <p className="mt-1 text-sm text-slate-500">
              Lê um arquivo de backup e repõe os dados no sistema. Use só em caso de
              necessidade (dados perdidos, sistema zerado, migração).
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <ShieldAlert size={14} className="shrink-0" />
              A restauração sobrescreve registros com o mesmo ID. Peça ajuda antes de usar se tiver dúvida.
            </div>
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {importing ? 'Restaurando...' : 'Escolher arquivo e restaurar'}
              <input type="file" accept=".json,application/json" className="hidden" onChange={importarBackup} disabled={importing} />
            </label>
            {importMsg && (
              <div className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                importMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}>
                {importMsg.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {importMsg.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Como usar */}
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">📅 Rotina recomendada</h3>
        <ol className="mt-3 space-y-2 text-sm text-slate-600">
          <li><b>1.</b> Todo dia (ou semana) → botão <b>"Baixar backup agora"</b></li>
          <li><b>2.</b> O arquivo cai no seu PC com a data no nome (<code className="rounded bg-slate-100 px-1 py-0.5 text-xs">playdrop-backup-2026-10-15.json</code>)</li>
          <li><b>3.</b> Guarde no Drive/GitHub privado — nunca só no mesmo PC</li>
          <li><b>4.</b> Se algo der errado um dia → restaure o backup mais recente aqui</li>
        </ol>
      </div>
    </div>
  )
}
