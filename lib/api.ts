import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionContext, type SessionContext } from '@/lib/db/session'
import type { Household } from '@/lib/types/database'

export interface ApiError {
  error: string
  detalls?: unknown
}

export function jsonError(message: string, status: number, detalls?: unknown) {
  const body: ApiError = detalls === undefined ? { error: message } : { error: message, detalls }
  return NextResponse.json(body, { status })
}

/**
 * Llegeix i valida el cos JSON d'una petició.
 *
 * Retorna un discriminant en comptes de llançar: així cada ruta decideix el
 * missatge d'error, i cap excepció de validació acaba a la consola del servidor
 * com si fos un error nostre quan en realitat és una petició mal formada.
 */
export async function readBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: NextResponse }> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return { ok: false, response: jsonError('El cos de la petició no és JSON vàlid', 400) }
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, response: jsonError('Dades no vàlides', 422, z.treeifyError(parsed.error)) }
  }
  return { ok: true, data: parsed.data }
}

/** Sessió amb casa assignada, o la resposta d'error corresponent. */
export async function requireSession(): Promise<
  { ok: true; ctx: SessionContext & { household: Household } } | { ok: false; response: NextResponse }
> {
  const ctx = await getSessionContext()
  if (!ctx) return { ok: false, response: jsonError('Cal iniciar sessió', 401) }
  if (!ctx.household) {
    return { ok: false, response: jsonError('Encara no pertanys a cap casa', 403) }
  }
  return { ok: true, ctx: { ...ctx, household: ctx.household } }
}

/**
 * Tradueix els errors de Postgres a alguna cosa que es pugui ensenyar a la
 * família. Els codes venen de les excepcions que llancen les funcions de la BD.
 */
export function postgresErrorStatus(code: string | undefined): number {
  switch (code) {
    case '42501':
      return 403
    case '23505':
      return 409
    case 'P0002':
      return 404
    case '23503':
      return 422
    default:
      return 400
  }
}
