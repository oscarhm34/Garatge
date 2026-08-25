import { NextResponse } from 'next/server'
import { z } from 'zod'
import { identifyItems } from '@/lib/anthropic'
import { jsonError, postgresErrorStatus, readBody, requireSession } from '@/lib/api'
import { getCategories, getTags } from '@/lib/db/items'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  // El client ja ha redimensionat la imatge a 1568 px pel costat llarg: més
  // resolució no millora el reconeixement i multiplica els tokens d'entrada.
  imatge: z.string().min(100).max(6_000_000),
  tipus: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})

/** L'anàlisi d'una foto pot tardar; el límit per defecte de Vercel es queda curt. */
export const maxDuration = 60

export async function POST(request: Request) {
  const session = await requireSession()
  if (!session.ok) return session.response

  const body = await readBody(request, schema)
  if (!body.ok) return body.response

  // El comptador s'incrementa ABANS de cridar el model. Fer-ho després deixaria
  // que les crides que fallen a mig camí no comptessin, que és justament el cas
  // en què un bucle mal fet dispararia la factura.
  const supabase = await createClient()
  const { error: limitError } = await supabase.rpc('register_ai_call', {
    p_kind: 'identify',
    p_daily_limit: 200,
  })

  if (limitError) {
    const missatge =
      limitError.code === '54000'
        ? 'Heu arribat al límit de fotos analitzades per avui'
        : limitError.message
    return jsonError(missatge, limitError.code === '54000' ? 429 : postgresErrorStatus(limitError.code))
  }

  const [categories, tags] = await Promise.all([getCategories(), getTags()])

  try {
    const objectes = await identifyItems({
      imatge: body.data.imatge,
      tipus: body.data.tipus,
      categories: categories.map((category) => category.name),
      tags: tags.map((tag) => tag.name),
    })
    return NextResponse.json({ objectes })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'No s\u2019ha pogut analitzar la foto',
      502,
    )
  }
}
