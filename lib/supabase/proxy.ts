import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { publicEnv } from '@/lib/env'
import type { Database } from '@/lib/types/database'

/** Rutes accessibles sense sessió. */
const PUBLIC_PREFIXES = ['/login', '/auth', '/api/salut', '/manifest.webmanifest', '/icones']

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
          // Capçaleres anti-cache que envia la llibreria. Sense elles, un CDN
          // podria servir la galeta de sessió d'algú altre.
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value)
          }
        },
      },
    },
  )

  // Res entre createServerClient() i getClaims(): qualsevol cosa pel mig fa que
  // el refresc del token es perdi i la gent es desconnecti sola de tant en tant.
  const { data } = await supabase.auth.getClaims()
  const isLoggedIn = Boolean(data?.claims)

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (!isLoggedIn && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Es guarda la destinació perquè, en escanejar el QR d'un armari sense sessió
    // oberta, després d'entrar s'arribi a l'armari i no a la pàgina d'inici.
    url.searchParams.set('next', pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  if (isLoggedIn && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}
