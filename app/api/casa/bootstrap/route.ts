import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jsonError, postgresErrorStatus, readBody, requireSession } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  armaris: z.number().int().min(1).max(20).default(3),
  portes: z.number().int().min(1).max(20).default(3),
})

/**
 * Crea els armaris i les portes de cop.
 *
 * No crea prestatges: els tres armaris del garatge no estan distribuïts igual
 * per dins, i inventar-se una estructura només obligaria a esborrar-la després.
 */
export async function POST(request: Request) {
  const session = await requireSession()
  if (!session.ok) return session.response

  const body = await readBody(request, schema)
  if (!body.ok) return body.response

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('bootstrap_garage', {
    p_cabinets: body.data.armaris,
    p_doors: body.data.portes,
  })

  if (error) {
    const missatge =
      error.code === '23505' ? 'Aquesta casa ja té ubicacions creades' : error.message
    return jsonError(missatge, postgresErrorStatus(error.code))
  }

  return NextResponse.json({ creades: data }, { status: 201 })
}
