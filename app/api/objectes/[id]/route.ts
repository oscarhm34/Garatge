import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jsonError, postgresErrorStatus, readBody, requireSession } from '@/lib/api'
import { syncItemTags } from '@/lib/db/tags'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  nom: z.string().trim().min(1).max(120).optional(),
  descripcio: z.string().trim().max(2000).nullable().optional(),
  ubicacio: z.uuid().nullable().optional(),
  categoria: z.uuid().nullable().optional(),
  quantitat: z.number().int().min(1).max(99999).optional(),
  foto: z.string().max(500).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  etiquetes: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
})

export async function PATCH(request: Request, context: RouteContext<'/api/objectes/[id]'>) {
  const session = await requireSession()
  if (!session.ok) return session.response

  const body = await readBody(request, schema)
  if (!body.ok) return body.response

  const { id } = await context.params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('items')
    .update({
      ...(body.data.nom !== undefined && { name: body.data.nom }),
      ...(body.data.descripcio !== undefined && { description: body.data.descripcio }),
      ...(body.data.ubicacio !== undefined && { location_id: body.data.ubicacio }),
      ...(body.data.categoria !== undefined && { category_id: body.data.categoria }),
      ...(body.data.quantitat !== undefined && { quantity: body.data.quantitat }),
      ...(body.data.foto !== undefined && { photo_url: body.data.foto }),
      ...(body.data.notes !== undefined && { notes: body.data.notes }),
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) return jsonError(error.message, postgresErrorStatus(error.code))
  if (!data) return jsonError('Objecte no trobat', 404)

  if (body.data.etiquetes !== undefined) {
    await syncItemTags(supabase, id, session.ctx.household.id, body.data.etiquetes)
  }
  return NextResponse.json({ objecte: data })
}

export async function DELETE(_request: Request, context: RouteContext<'/api/objectes/[id]'>) {
  const session = await requireSession()
  if (!session.ok) return session.response

  const { id } = await context.params
  const supabase = await createClient()
  const { error } = await supabase.from('items').delete().eq('id', id)

  if (error) return jsonError(error.message, postgresErrorStatus(error.code))
  return new NextResponse(null, { status: 204 })
}
