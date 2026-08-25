import { createClient } from '@/lib/supabase/server'
import type { LocationDetail, LocationKind } from '@/lib/types/database'

export async function getLocationByCode(code: string): Promise<LocationDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('locations_detail')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle()
  return data
}

export async function getLocationById(id: string): Promise<LocationDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('locations_detail').select('*').eq('id', id).maybeSingle()
  return data
}

export async function getChildren(parentId: string | null): Promise<LocationDetail[]> {
  const supabase = await createClient()

  // Les dues branques s'escriuen senceres a posta: .is() i .eq() retornen tipus
  // de constructor diferents i unir-los en una variable fa que la inferència de
  // supabase-js es mossegui la cua i acabi en any.
  if (parentId === null) {
    const { data } = await supabase
      .from('locations_detail')
      .select('*')
      .is('parent_id', null)
      .order('position', { ascending: true })
    return data ?? []
  }

  const { data } = await supabase
    .from('locations_detail')
    .select('*')
    .eq('parent_id', parentId)
    .order('position', { ascending: true })
  return data ?? []
}

/** Els armaris, per al mapa del garatge. */
export async function getRootLocations(): Promise<LocationDetail[]> {
  return getChildren(null)
}

/**
 * Fils d'Ariadna. Es construeix pujant per parent_id: són com a molt quatre
 * consultes indexades per la clau primària, molt més barat que arrossegar tot
 * l'arbre a memòria per a cada pàgina.
 */
export async function getBreadcrumb(locationId: string): Promise<LocationDetail[]> {
  const supabase = await createClient()
  const chain: LocationDetail[] = []
  let current: string | null = locationId

  for (let depth = 0; current !== null && depth < 20; depth += 1) {
    // Còpia amb tipus explícit: si es passés `current` directament, supabase-js
    // inferiria el tipus de `data` a partir d'una variable que després torna a
    // assignar-se des de `data`, i TypeScript ho descarta com a circular.
    const id: string = current
    const { data } = await supabase
      .from('locations_detail')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (!data) break
    chain.unshift(data)
    current = data.parent_id
  }
  return chain
}

/** El tipus de fill que té sentit crear dins d'una ubicació d'un tipus donat. */
export function defaultChildKind(kind: LocationKind): LocationKind {
  switch (kind) {
    case 'armari':
      // Un compartiment, no una porta: el que es pot etiquetar es cada espai
      // tancat, i dues portes batents en comparteixen un.
      return 'modul'
    case 'porta':
    case 'modul':
      return 'prestatge'
    case 'prestatge':
      return 'caixa'
    default:
      return 'caixa'
  }
}

/**
 * Vocabulari de cada tipus d'ubicacio.
 *
 * Cal el genere i el plural escrits a ma: en catala el plural no s'obte
 * afegint una essa (caixa -> caixes, porta -> portes) i l'article depen del
 * genere. Fer-ho a ull produeix "Afegir un caixa" i "Caixas", que es el que
 * fa que una app sembli mig acabada.
 */
interface Vocabulari {
  singular: string
  plural: string
  /** Article indeterminat, per a "Afegir ___". */
  article: string
}

export const KIND_VOCAB: Record<LocationKind, Vocabulari> = {
  armari: { singular: 'Armari', plural: 'Armaris', article: 'un' },
  porta: { singular: 'Porta', plural: 'Portes', article: 'una' },
  modul: { singular: 'Espai', plural: 'Espais', article: 'un' },
  prestatge: { singular: 'Prestatge', plural: 'Prestatges', article: 'un' },
  caixa: { singular: 'Caixa', plural: 'Caixes', article: 'una' },
  altre: { singular: 'Ubicació', plural: 'Ubicacions', article: 'una' },
}
