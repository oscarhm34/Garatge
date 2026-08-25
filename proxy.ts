import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Tot excepte fitxers estàtics i imatges. Cal que hi passin les pàgines
     * normals perquè és aquí on es refresca el token de sessió.
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
