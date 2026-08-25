import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Tancar sessió va per POST i no per GET a posta: un <img src="/auth/signout">
 * en qualsevol pàgina desconnectaria l'usuari sense que ell hi fes res.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', request.nextUrl.origin), { status: 303 })
}
