import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Batec diari.
 *
 * El pla gratuït de Supabase pausa els projectes després d'una setmana sense
 * activitat. Aquesta ruta la crida el cron de Vercel un cop al dia i fa una
 * consulta de veritat contra Postgres: sense una consulta real, una resposta
 * estàtica no comptaria com a activitat i el projecte es pausaria igualment.
 *
 * Serveix també de comprovació d'estat: si torna 503, la base de dades no hi és.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('ping')

  if (error) {
    return NextResponse.json(
      { estat: 'malament', detall: error.message },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return NextResponse.json(
    { estat: 'be', servidor: data },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
