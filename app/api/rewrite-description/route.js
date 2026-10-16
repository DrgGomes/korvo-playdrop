import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const MODELOS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash']
const SEM_PENSAMENTO = ['gemini-flash-latest', 'gemini-2.5-flash']

function montarPrompt(nome, descricao, tamanhos) {
  return [
    'Você é um copywriter especialista em anúncios do Mercado Livre. Reescreva a descrição do produto informada, deixando-a organizada, chamativa e vendável.',
    '',
    'REGRAS OBRIGATÓRIAS:',
    '1. SEM emoji, SEM HTML e SEM marcação de texto (nada de asteriscos, hashtags ou colchetes de markdown).',
    '2. Português do Brasil, parágrafos curtos, com linha em branco entre os blocos.',
    '3. Estrutura obrigatória:',
    '   a) Uma frase curta explicando o que é o produto.',
    '   b) Características: material, modelo, tipo de roupa e forma de caimento (use apenas informações da descrição original; não invente dados).',
    '   c) Tabela de medidas no padrão abaixo — incluir SOMENTE se o produto tiver tamanhos informados ou citados na descrição:',
    'TABELA DE MEDIDAS (Largura x Comprimento):',
    '• P: 47 cm x 65 cm | (1,40-1,50m | 35-45kg)',
    '• M: 52 cm x 67 cm | (1,48-1,58m | 45-55kg)',
    '• G: 52 cm x 68 cm | (1,56-1,68m | 52-65kg)',
    '• GG: 57 cm x 69 cm | (1,64-1,78m | 60-78kg)',
    'Dica: Na dúvida, escolha o tamanho maior!',
    '(Margem de erro: ±2cm)',
    '   d) Última linha do texto: Garantia de 30 dias.',
    '4. Se os tamanhos do produto forem diferentes de P/M/G/GG (ex.: PP, XGG), adapte a tabela usando SOMENTE os tamanhos do produto, no mesmo formato visual, seguindo a mesma progressão de medidas (PP um passo antes de P; XGG um passo depois de GG).',
    '5. Se a descrição original trouxer medidas próprias, cuidados de lavagem ou informações específicas da estampa, preserve-as em blocos organizados.',
    '6. Retorne APENAS o texto final da descrição: sem comentários, sem aspas e sem saudação.',
    '',
    'PRODUTO: ' + nome,
    'TAMANHOS DO PRODUTO: ' + (tamanhos && tamanhos.length ? tamanhos.join(', ') : 'não informados'),
    '',
    'DESCRIÇÃO ATUAL:',
    descricao,
  ].join('\n')
}

export async function POST(request) {
  const auth = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'nao autenticado' }, { status: 401 })
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: 'servidor sem credenciais' }, { status: 500 })
  }
  const admin = createClient(url, serviceKey)
  const { data: { user }, error: authError } = await admin.auth.getUser(auth)
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'nao autenticado' }, { status: 401 })
  }
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'sem permissao' }, { status: 403 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'json invalido' }, { status: 400 })
  }

  const nome = (body.name || '').toString().slice(0, 300)
  const descricao = (body.description || '').toString().slice(0, 8000)
  const tamanhos = Array.isArray(body.sizes) ? body.sizes.map(String).slice(0, 20) : []
  if (!descricao.trim()) {
    return NextResponse.json({ ok: false, error: 'escreva ou cole uma descricao primeiro' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'GEMINI_API_KEY ausente na Vercel' }, { status: 500 })
  }

  const prompt = montarPrompt(nome, descricao, tamanhos)
  let ultimoErro = ''
  for (const modelo of MODELOS) {
    try {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/' + modelo + ':generateContent?key=' + apiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
              ...(SEM_PENSAMENTO.includes(modelo) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            },
          }),
        }
      )
      if (!res.ok) {
        ultimoErro = 'HTTP ' + res.status
        continue
      }
      const data = await res.json()
      const texto = (data.candidates?.[0]?.content?.parts || [])
        .map((p) => p.text || '')
        .join('')
        .trim()
      if (!texto) {
        ultimoErro = 'resposta vazia'
        continue
      }
      return NextResponse.json({ ok: true, description: texto })
    } catch (e) {
      ultimoErro = String(e)
    }
  }
  return NextResponse.json({ ok: false, error: 'falha na IA (' + ultimoErro + ')' }, { status: 502 })
}
