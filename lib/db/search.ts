import { createClient } from '@/lib/supabase/server'
import type { ItemDetail } from '@/lib/types/database'

/**
 * Cerca d'objectes.
 *
 * Tota la feina la fa public.search_items() a Postgres: combina full-text sobre
 * el vector amb pesos i trigrames sobre el nom normalitzat, de manera que
 * "martel" troba el martell i "mar" ja el proposa mentre s'escriu. Fer-ho a la
 * base de dades i no aquí és el que permet que sigui una sola anada i tornada.
 */
export async function searchItems(query: string, limit = 30): Promise<ItemDetail[]> {
  const trimmed = query.trim()
  if (trimmed.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('search_items', {
    p_query: trimmed,
    p_limit: limit,
  })

  if (error) throw new Error(`Error de cerca: ${error.message}`)
  return data ?? []
}
