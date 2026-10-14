export function formatBRL(value) {
  return (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatDateTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const ORDER_STATUS = {
  novo: { label: 'Novo', color: 'bg-blue-100 text-blue-700' },
  em_producao: { label: 'Em produção', color: 'bg-amber-100 text-amber-700' },
  enviado: { label: 'Enviado', color: 'bg-violet-100 text-violet-700' },
  entregue: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  devolucao: { label: 'Devolução', color: 'bg-slate-200 text-slate-700' },
}

export function orderStatusLabel(status) {
  const map = {
    novo: 'Novo',
    em_producao: 'Em produção',
    em_separacao: 'Em separação',
    separado: 'Separado',
    enviado: 'Enviado',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
    devolucao: 'Devolução',
  }
  return map[status] || status
}

export function orderStatusColor(status) {
  const map = {
    novo: 'bg-blue-100 text-blue-700',
    em_producao: 'bg-amber-100 text-amber-700',
    em_separacao: 'bg-orange-100 text-orange-700',
    separado: 'bg-cyan-100 text-cyan-700',
    enviado: 'bg-indigo-100 text-indigo-700',
    entregue: 'bg-emerald-100 text-emerald-700',
    cancelado: 'bg-red-100 text-red-700',
    devolucao: 'bg-slate-200 text-slate-600',
  }
  return map[status] || 'bg-slate-100 text-slate-600'
}
