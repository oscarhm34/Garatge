import { createClient } from '@/lib/supabase/server'
import type { Activity } from '@/lib/types/database'

export interface ActivityEntry extends Activity {
  actor_name: string | null
}

export async function getRecentActivity(limit = 50): Promise<ActivityEntry[]> {
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!rows || rows.length === 0) return []

  // Els noms es resolen en una segona consulta i no amb un JOIN incrustat perquè
  // la mateixa persona surt desenes de vegades: així es demanen un cop cadascuna.
  const actorIds = [...new Set(rows.map((row) => row.actor_id).filter((id): id is string => id !== null))]
  const names = new Map<string, string>()

  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', actorIds)
    for (const profile of profiles ?? []) names.set(profile.id, profile.display_name)
  }

  return rows.map((row) => ({
    ...row,
    actor_name: row.actor_id === null ? null : (names.get(row.actor_id) ?? null),
  }))
}

/** Historial d'un objecte concret, per a la seva fitxa. */
export async function getItemActivity(itemId: string, limit = 20): Promise<Activity[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('activity_log')
    .select('*')
    .eq('entity_id', itemId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
