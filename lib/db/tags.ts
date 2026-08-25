import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

type Client = SupabaseClient<Database>

/**
 * Deixa un objecte amb exactament les etiquetes indicades.
 *
 * Les que no existeixen es creen sobre la marxa: al garatge la gent escriu
 * "cargols" abans que ningú hagi pensat en un catàleg d'etiquetes, i obligar a
 * crear-les primer faria que no se'n fes servir cap.
 *
 * La comparació es fa en minúscules dins de JavaScript i no amb un upsert:
 * la unicitat a la BD és un índex sobre lower(name), i PostgREST no accepta
 * índexs d'expressió com a destí d'onConflict. Una casa té desenes d'etiquetes,
 * no milers, així que portar-les totes surt a compte.
 */
export async function syncItemTags(
  supabase: Client,
  itemId: string,
  householdId: string,
  tagNames: string[],
): Promise<void> {
  const wanted = [...new Map(
    tagNames
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .map((name) => [name.toLowerCase(), name] as const),
  ).values()]

  if (wanted.length === 0) {
    await supabase.from('item_tags').delete().eq('item_id', itemId)
    return
  }

  const { data: existing } = await supabase.from('tags').select('id, name')
  const byLower = new Map((existing ?? []).map((tag) => [tag.name.toLowerCase(), tag.id]))

  const missing = wanted.filter((name) => !byLower.has(name.toLowerCase()))
  if (missing.length > 0) {
    const { data: created } = await supabase
      .from('tags')
      .insert(missing.map((name) => ({ household_id: householdId, name })))
      .select('id, name')

    for (const tag of created ?? []) byLower.set(tag.name.toLowerCase(), tag.id)

    // Si un altre mòbil s'ha avançat i ha creat la mateixa etiqueta, l'insert
    // falla per l'índex únic. Tornar a llegir resol el cas sense fer sorolls.
    if (!created || created.length < missing.length) {
      const { data: refetched } = await supabase.from('tags').select('id, name')
      for (const tag of refetched ?? []) byLower.set(tag.name.toLowerCase(), tag.id)
    }
  }

  const ids = wanted
    .map((name) => byLower.get(name.toLowerCase()))
    .filter((id): id is string => id !== undefined)

  await supabase.from('item_tags').delete().eq('item_id', itemId)
  if (ids.length > 0) {
    await supabase.from('item_tags').insert(ids.map((tag_id) => ({ item_id: itemId, tag_id })))
  }
}
