import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jsonError, postgresErrorStatus, readBody, requireSession } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'

/**
 * Moure un objecte. S'accepta l'uuid de la ubicació o el codi imprès al QR,
 * perquè el flux real és: obrir la fitxa, prémer "Moure", escanejar l'adhesiu
 * del nou lloc. Qui escaneja no sap ni ha de saber cap uuid.
 */
const schema = z.union([
  z.object({ ubicacio: z.uuid().nullable() }),
  z.object({ codi: z.string().trim().min(2).max(32) }),
])

export async function POST(request: Request, context: RouteContext<'/api/objectes/[id]/moure'>) {
  const session = await requireSession()
  if (!session.ok) return session.response

  const body = await readBody(request, schema)
  if (!body.ok) return body.response

  const { id } = await context.params
  const supabase = await createClient()

  let locationId: string | null
  if ('codi' in body.data) {
    const { data: location } = await supabase
      .from('locations')
      .select('id')
      .eq('code', body.data.codi.toUpperCase())
      .maybeSingle()

    if (!location) return jsonError(`No hi ha cap ubicació amb el codi ${body.data.codi}`, 404)
    locationId = location.id
  } else {
    locationId = body.data.ubicacio
  }

  const { data, error } = await supabase
    .from('items')
    .update({ location_id: locationId })
    .eq('id', id)
    .select('id, name, location_id')
    .maybeSingle()

  if (error) return jsonError(error.message, postgresErrorStatus(error.code))
  if (!data) return jsonError('Objecte no trobat', 404)

  // Es retorna el camí sencer perquè el mòbil pugui ensenyar "Mogut a Armari 1 ·
  // Porta 2 · Prestatge 1" sense una segona anada i tornada.
  let cami: string | null = null
  if (locationId !== null) {
    const { data: path } = await supabase.rpc('location_path', { p_id: locationId })
    cami = path
  }

  return NextResponse.json({ objecte: data, cami })
}
