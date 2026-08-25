import { createClient } from '@/lib/supabase/server'
import type { Category, ItemDetail, Tag } from '@/lib/types/database'

export async function getItem(id: string): Promise<ItemDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('items_detail').select('*').eq('id', id).maybeSingle()
  return data
}

/** Objectes que hi ha directament en una ubicació (no en els seus fills). */
export async function getItemsInLocation(locationId: string): Promise<ItemDetail[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('items_detail')
    .select('*')
    .eq('location_id', locationId)
    .order('name', { ascending: true })
  return data ?? []
}

export async function getRecentItems(limit = 12): Promise<ItemDetail[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('items_detail')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

/** Objectes que algú té agafats ara mateix. */
export async function getBorrowedItems(): Promise<ItemDetail[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('items_detail')
    .select('*')
    .not('open_loan_id', 'is', null)
    .order('borrowed_at', { ascending: true })
  return data ?? []
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('name')
  return data ?? []
}

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('tags').select('*').order('name')
  return data ?? []
}

export async function countItems(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase.from('items').select('id', { count: 'exact', head: true })
  return count ?? 0
}
