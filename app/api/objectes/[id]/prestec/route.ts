import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jsonError, postgresErrorStatus, readBody, requireSession } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  nota: z.string().trim().max(500).nullable().default(null),
})

/** Agafar un objecte: "me l'enduc jo". */
export async function POST(request: Request, context: RouteContext<'/api/objectes/[id]/prestec'>) {
  const session = await requireSession()
  if (!session.ok) return session.response

  const body = await readBody(request, schema)
  if (!body.ok) return body.response

  const { id } = await context.params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('loans')
    .insert({
      household_id: session.ctx.household.id,
      item_id: id,
      borrowed_by: session.ctx.userId,
      note: body.data.nota,
    })
    .select()
    .single()

  if (error) {
    // L'índex únic parcial loans_one_open_per_item impedeix dos préstecs oberts
    // alhora: si salta, és que algú altre ja se l'havia endut.
    const missatge =
      error.code === '23505'
        ? 'Aquest objecte ja el té algú altre'
        : error.code === '23503'
          ? 'Aquest objecte no existeix'
          : error.message
    return jsonError(missatge, postgresErrorStatus(error.code))
  }

  return NextResponse.json({ prestec: data }, { status: 201 })
}

/** Tornar-lo al seu lloc. */
export async function DELETE(_request: Request, context: RouteContext<'/api/objectes/[id]/prestec'>) {
  const session = await requireSession()
  if (!session.ok) return session.response

  const { id } = await context.params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('loans')
    .update({ returned_at: new Date().toISOString() })
    .eq('item_id', id)
    .is('returned_at', null)
    .select()
    .maybeSingle()

  if (error) return jsonError(error.message, postgresErrorStatus(error.code))
  if (!data) return jsonError('Aquest objecte no el tenia ningú', 404)
  return NextResponse.json({ prestec: data })
}
