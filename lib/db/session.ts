import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Household, Profile } from '@/lib/types/database'

export interface SessionContext {
  userId: string
  email: string | null
  profile: Profile
  household: Household | null
}

/**
 * Perfil i casa de qui està mirant la pàgina.
 *
 * Embolcallat amb cache() de React: un layout, la seva pàgina i tres components
 * poden demanar-ho tot alhora i només es fa una consulta per petició.
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient()

  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (!claims?.sub) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', claims.sub)
    .maybeSingle()

  // El trigger d'alta encara no ha corregut (primera petició després del registre).
  if (error || !profile) return null

  let household: Household | null = null
  if (profile.household_id) {
    const { data } = await supabase
      .from('households')
      .select('*')
      .eq('id', profile.household_id)
      .maybeSingle()
    household = data
  }

  const email = typeof claims.email === 'string' ? claims.email : null
  return { userId: claims.sub, email, profile, household }
})

/**
 * Igual que l'anterior però exigint casa. Les pàgines de dins de l'app la fan
 * servir per no haver de comprovar nuls a cada consulta.
 */
export async function requireHousehold(): Promise<SessionContext & { household: Household }> {
  const ctx = await getSessionContext()
  if (!ctx) throw new Error('NO_SESSION')
  if (!ctx.household) throw new Error('NO_HOUSEHOLD')
  return { ...ctx, household: ctx.household }
}
