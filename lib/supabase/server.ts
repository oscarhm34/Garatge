import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { publicEnv } from '@/lib/env'
import type { Database } from '@/lib/types/database'

/**
 * Client per a components de servidor i rutes d'API.
 *
 * Es crea un per petició a posta: amb Fluid Compute, guardar-lo en una variable
 * global faria que dues peticions de dos usuaris compartissin sessió.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Els components de servidor no poden escriure galetes. No passa res:
            // qui refresca la sessió és proxy.ts, abans que la pàgina es renderitzi.
          }
        },
      },
    },
  )
}
