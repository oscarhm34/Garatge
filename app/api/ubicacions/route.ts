import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jsonError, postgresErrorStatus, readBody, requireSession } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  pare: z.uuid().nullable(),
  tipus: z.enum(['armari', 'porta', 'modul', 'prestatge', 'caixa', 'altre']),
  nom: z.string().trim().min(1).max(80).nullable().default(null),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().default(null),
})

/**
 * Alta d'ubicació.
 *
 * Passa per la funció add_location() de la BD i no per un INSERT perquè el codi
 * (A2-P1-E3) el calcula Postgres dins de la mateixa transacció: si dues persones
 * afegeixen una caixa alhora des de dos mòbils, cap de les dues es queda sense.
 */
export async function POST(request: Request) {
  const session = await requireSession()
  if (!session.ok) return session.response

  const body = await readBody(request, schema)
  if (!body.ok) return body.response

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('add_location', {
    p_parent: body.data.pare,
    p_kind: body.data.tipus,
    p_name: body.data.nom,
    p_color: body.data.color,
  })

  if (error) return jsonError(error.message, postgresErrorStatus(error.code))
  return NextResponse.json({ ubicacio: data }, { status: 201 })
}
