import { NextResponse } from 'next/server'
import { jsonError } from '@/lib/api'
import { signPhotos } from '@/lib/db/photos'
import { searchItems } from '@/lib/db/search'
import { getSessionContext } from '@/lib/db/session'

/** Cerca en directe mentre s'escriu. */
export async function GET(request: Request) {
  const ctx = await getSessionContext()
  if (!ctx?.household) return jsonError('Cal iniciar sessió', 401)

  const query = new URL(request.url).searchParams.get('q') ?? ''
  if (query.trim().length === 0) return NextResponse.json({ resultats: [], fotos: {} })

  try {
    const resultats = await searchItems(query, 30)
    // Les fotos se signen totes de cop; el client rep un mapa ruta -> URL.
    const fotos = await signPhotos(resultats.map((item) => item.photo_url))
    return NextResponse.json({ resultats, fotos: Object.fromEntries(fotos) })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Error de cerca', 500)
  }
}
