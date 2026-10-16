import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-playdrop-token',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request) {
  const token = request.headers.get('x-playdrop-token')
  if (!token || token !== process.env.PLAYDROP_IMPORT_TOKEN) {
    return NextResponse.json({ ok: false, error: 'token invalido' }, { status: 401, headers: CORS_HEADERS })
  }

  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceUrl || !serviceKey) {
    return NextResponse.json({ ok: false, error: 'servidor sem credenciais' }, { status: 500, headers: CORS_HEADERS })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'json invalido' }, { status: 400, headers: CORS_HEADERS })
  }

  const titulo = (body.title || '').trim()
  const url = (body.source_url || '').trim()
  if (!titulo || !url) {
    return NextResponse.json({ ok: false, error: 'title e source_url obrigatorios' }, { status: 400, headers: CORS_HEADERS })
  }

  const admin = createClient(serviceUrl, serviceKey)

  const { data: existing } = await admin
    .from('imported_products')
    .select('id')
    .eq('source_url', url)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ ok: true, status: 'duplicado' }, { headers: CORS_HEADERS })
  }

  const { error } = await admin.from('imported_products').insert({
    source_site: body.source_site || 'desconhecido',
    source_url: url,
    title: titulo.slice(0, 300),
    description: body.description || null,
    price: body.price ?? null,
    photos: body.photos || [],
    sizes: body.sizes || [],
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, status: 'duplicado' }, { headers: CORS_HEADERS })
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: CORS_HEADERS })
  }
  return NextResponse.json({ ok: true, status: 'criado' }, { headers: CORS_HEADERS })
}
