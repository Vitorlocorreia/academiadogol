import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * Endpoint de Keep-Alive do banco de dados Supabase.
 * Acionado automaticamente via:
 * 1. Vercel Cron Job (diariamente)
 * 2. Inngest Scheduled Cron (a cada 6h)
 * 3. GitHub Actions Workflow (a cada 12h)
 * Realiza leitura e escrita leve via RPC no PostgREST para impedir auto-pause por inatividade.
 */
export async function GET() {
  try {
    const supabase = createAdminClient()

    const [{ data: heartbeat, error: rpcError }, { data: fields, error: fieldsError }] =
      await Promise.all([
        supabase.rpc('keep_alive_heartbeat'),
        supabase.from('fields').select('id, name').eq('is_active', true),
      ])

    if (rpcError && fieldsError) {
      return NextResponse.json(
        {
          ok: false,
          error: rpcError.message || fieldsError.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        heartbeat: heartbeat ?? { status: 'alive' },
        activeFields: fields?.length ?? 0,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || 'Erro inesperado no keep-alive',
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }
}
