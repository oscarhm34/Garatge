import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jsonError, postgresErrorStatus, readBody, requireSession } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  armaris: z.number().int().min(1).max(20).default(3),
  /** Compartiments independents de cada armari, no portes: en aquests armaris
   *  dues portes batents obren un sol espai. */
  espais: z.number().int().min(1).max(20).default(2),
})

/**
 * Crea els armaris i els seus compartiments de cop.
 *
 * Compta espais i no portes: en aquests armaris de tres portes, dues son
 * batents i obren un unic compartiment. Etiquetar-ne tres faria que dos
 * adhesius apuntessin al mateix lloc.
 *
 * No crea prestatges: els armaris no estan distribuits igual per dins, i
 * inventar-se una estructura nomes obligaria a esborrar-la despres.
 */
export async function POST(request: Request) {
  const session = await requireSession()
  if (!session.ok) return session.response

  const body = await readBody(request, schema)
  if (!body.ok) return body.response

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('bootstrap_garage', {
    p_cabinets: body.data.armaris,
    p_compartments: body.data.espais,
  })

  if (error) {
    const missatge =
      error.code === '23505' ? 'Aquesta casa ja té ubicacions creades' : error.message
    return jsonError(missatge, postgresErrorStatus(error.code))
  }

  return NextResponse.json({ creades: data }, { status: 201 })
}
