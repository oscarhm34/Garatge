import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Destí de l'enllaç màgic del correu.
 *
 * El camí principal per entrar és el codi de sis xifres, perquè funciona encara
 * que el correu s'obri en un navegador diferent del que té l'app. Això és el
 * pla B per a qui prefereix clicar l'enllaç.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const rawNext = searchParams.get('next') ?? '/'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL('/login?error=enllac-incomplet', origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

  if (error) {
    return NextResponse.redirect(new URL('/login?error=enllac-caducat', origin))
  }

  return NextResponse.redirect(new URL(next, origin))
}
