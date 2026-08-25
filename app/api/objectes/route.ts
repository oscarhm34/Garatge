import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jsonError, postgresErrorStatus, readBody, requireSession } from '@/lib/api'
import { syncItemTags } from '@/lib/db/tags'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  nom: z.string().trim().min(1).max(120),
  descripcio: z.string().trim().max(2000).nullable().default(null),
  ubicacio: z.uuid().nullable().default(null),
  categoria: z.uuid().nullable().default(null),
  quantitat: z.number().int().min(1).max(99999).default(1),
  foto: z.string().max(500).nullable().default(null),
  notes: z.string().trim().max(2000).nullable().default(null),
  etiquetes: z.array(z.string().trim().min(1).max(30)).max(20).default([]),
})

export async function POST(request: Request) {
  const session = await requireSession()
  if (!session.ok) return session.response

  const body = await readBody(request, schema)
  if (!body.ok) return body.response

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('items')
    .insert({
      household_id: session.ctx.household.id,
      name: body.data.nom,
      description: body.data.descripcio,
      location_id: body.data.ubicacio,
      category_id: body.data.categoria,
      quantity: body.data.quantitat,
      photo_url: body.data.foto,
      notes: body.data.notes,
      created_by: session.ctx.userId,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, postgresErrorStatus(error.code))

  await syncItemTags(supabase, data.id, session.ctx.household.id, body.data.etiquetes)
  return NextResponse.json({ objecte: data }, { status: 201 })
}
