import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jsonError, postgresErrorStatus, readBody, requireSession } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'

const patchSchema = z.object({
  nom: z.string().trim().min(1).max(80).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  pare: z.uuid().nullable().optional(),
  posicio: z.number().int().min(0).max(9999).optional(),
})

export async function PATCH(request: Request, context: RouteContext<'/api/ubicacions/[id]'>) {
  const session = await requireSession()
  if (!session.ok) return session.response

  const body = await readBody(request, patchSchema)
  if (!body.ok) return body.response

  const { id } = await context.params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('locations')
    .update({
      ...(body.data.nom !== undefined && { name: body.data.nom }),
      ...(body.data.color !== undefined && { color: body.data.color }),
      ...(body.data.notes !== undefined && { notes: body.data.notes }),
      ...(body.data.pare !== undefined && { parent_id: body.data.pare }),
      ...(body.data.posicio !== undefined && { position: body.data.posicio }),
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) return jsonError(error.message, postgresErrorStatus(error.code))
  if (!data) return jsonError('Ubicació no trobada', 404)
  return NextResponse.json({ ubicacio: data })
}

/**
 * Esborrar una ubicació s'emporta en cascada tot el que hi ha a sota. Els
 * objectes que hi havia no s'esborren: es queden sense ubicació i surten a la
 * llista de "sense lloc assignat" perquè algú els recol·loqui.
 */
export async function DELETE(_request: Request, context: RouteContext<'/api/ubicacions/[id]'>) {
  const session = await requireSession()
  if (!session.ok) return session.response
  if (session.ctx.profile.role !== 'admin') {
    return jsonError('Només un administrador de la casa pot esborrar ubicacions', 403)
  }

  const { id } = await context.params
  const supabase = await createClient()
  const { error } = await supabase.from('locations').delete().eq('id', id)

  if (error) return jsonError(error.message, postgresErrorStatus(error.code))
  return new NextResponse(null, { status: 204 })
}
