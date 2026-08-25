import { z } from 'zod'

/**
 * Validació de la configuració en arrencar.
 *
 * Sense això, una variable mal escrita al panell de Vercel es manifesta molt més
 * tard com un "Invalid API key" enmig d'una pàgina, i costa de lligar amb la causa.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url('NEXT_PUBLIC_SUPABASE_URL ha de ser una URL'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20, 'Falta la clau publicable de Supabase'),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
})

const serverSchema = z.object({
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-', 'ANTHROPIC_API_KEY no té el format esperat').optional(),
  SUPABASE_SECRET_KEY: z.string().min(20).optional(),
})

/**
 * Next.js substitueix `process.env.NEXT_PUBLIC_*` en temps de compilació només si
 * s'hi accedeix amb la propietat literal, mai amb un índex dinàmic. Per això
 * l'objecte s'escriu camp a camp.
 */
export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
})

/** Només per a codi de servidor (rutes d'API, components de servidor). */
export function serverEnv(): z.infer<typeof serverSchema> {
  return serverSchema.parse({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  })
}

/** URL absoluta del lloc, necessària per als enllaços màgics del correu i per als QR. */
export function siteUrl(): string {
  if (publicEnv.NEXT_PUBLIC_SITE_URL) return publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}
