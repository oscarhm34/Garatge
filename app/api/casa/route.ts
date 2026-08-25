import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jsonError, postgresErrorStatus, readBody } from '@/lib/api'
import { getSessionContext } from '@/lib/db/session'
import { createClient } from '@/lib/supabase/server'

const schema = z.discriminatedUnion('accio', [
  z.object({ accio: z.literal('crear'), nom: z.string().trim().min(1).max(80) }),
  z.object({ accio: z.literal('unir'), codi: z.string().trim().min(4).max(16) }),
])

/** Crea una casa nova o s'uneix a una existent amb el codi d'invitació. */
export async function POST(request: Request) {
  const ctx = await getSessionContext()
  if (!ctx) return jsonError('Cal iniciar sessió', 401)
  if (ctx.household) return jsonError('Ja pertanys a una casa', 409)

  const body = await readBody(request, schema)
  if (!body.ok) return body.response

  const supabase = await createClient()
  const { data, error } =
    body.data.accio === 'crear'
      ? await supabase.rpc('create_household', { p_name: body.data.nom })
      : await supabase.rpc('join_household', { p_invite_code: body.data.codi })

  if (error) {
    const missatge =
      error.code === 'P0002'
        ? 'Aquest codi d\u2019invitació no existeix'
        : error.code === '23505'
          ? 'Aquest usuari ja pertany a una casa'
          : error.message
    return jsonError(missatge, postgresErrorStatus(error.code))
  }

  return NextResponse.json({ household_id: data }, { status: 201 })
}
