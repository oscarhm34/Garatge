import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { serverEnv } from '@/lib/env'

/** Un objecte proposat a partir de la foto. */
export const SuggeriMent = z.object({
  nom: z.string().describe('Nom curt i concret en català, com el diria algú de casa'),
  categoria: z
    .string()
    .describe('Una de les categories existents, o una de nova només si cap encaixa'),
  etiquetes: z.array(z.string()).max(5).describe('Paraules per buscar-lo després'),
  quantitat: z.number().int().min(1).describe('Quantes unitats se’n veuen'),
  confianca: z.number().min(0).max(1).describe('Com de segur estàs de la identificació'),
})

export const Deteccio = z.object({
  objectes: z.array(SuggeriMent).max(25),
})

export type Suggeriment = z.infer<typeof SuggeriMent>

const MAX_IMAGE_BYTES = 4 * 1024 * 1024

/**
 * Part estable de les instruccions. Va separada i amb cache_control perquè és
 * idèntica a totes les crides: a partir de la segona, aquests tokens costen
 * una desena part.
 */
const SYSTEM_BASE = `Ets l'ajudant d'inventari del garatge d'una família catalana.

Et donen una foto d'un prestatge, una caixa o un objecte solt i has de dir què s'hi veu.

Regles:
- Escriu SEMPRE en català.
- Fes servir el nom que diria algú de casa: "martell", "cinta aïllant", "broques de fusta".
  Mai noms comercials ni descripcions llargues.
- Un objecte per entrada. Si veus sis pots de pintura iguals, és una entrada amb quantitat 6.
- Si una cosa és massa borrosa o tapada per identificar-la, no te la inventis: deixa-la fora.
- Ignora el fons, les parets, els prestatges buits i el mobiliari: només el que s'hi guarda.
- La confiança ha de ser sincera. Val més un 0,4 honest que un 0,9 inventat, perquè qui revisa
  la llista es fia d'aquest número per decidir què mira amb atenció.`

let client: Anthropic | null = null

function getClient(): Anthropic {
  const { ANTHROPIC_API_KEY } = serverEnv()
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Falta ANTHROPIC_API_KEY: l’alta per foto està desactivada')
  }
  client ??= new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  return client
}

interface IdentifyOptions {
  imatge: string
  tipus: 'image/jpeg' | 'image/png' | 'image/webp'
  /** Categories que ja existeixen a la casa, per reutilitzar-les. */
  categories: readonly string[]
  /** Etiquetes que ja existeixen, pel mateix motiu. */
  tags: readonly string[]
}

/**
 * Identifica els objectes d'una foto.
 *
 * Es passen les categories i etiquetes que ja existeixen a la casa perquè la
 * IA reutilitzi el vocabulari en comptes d'inventar-ne un de nou cada vegada;
 * si no, al cap de vint fotos hi hauria "Eines", "Eines de mà", "Ferramentes"
 * i "Utensilis" com a categories diferents i la cerca per categoria no serviria.
 */
export async function identifyItems({
  imatge,
  tipus,
  categories,
  tags,
}: IdentifyOptions): Promise<Suggeriment[]> {
  if (imatge.length > MAX_IMAGE_BYTES) {
    throw new Error('La imatge és massa gran')
  }

  const anthropic = getClient()

  const response = await anthropic.messages.parse({
    model: 'claude-opus-5',
    max_tokens: 4000,
    // Reconèixer eines en una foto no demana raonament profund, i l'esforç baix
    // retalla el cost i la latència sense perdre encert en aquesta tasca.
    output_config: { format: zodOutputFormat(Deteccio), effort: 'low' },
    system: [{ type: 'text', text: SYSTEM_BASE, cache_control: { type: 'ephemeral' } }],
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: tipus, data: imatge } },
          {
            type: 'text',
            text: [
              'Quines coses hi ha en aquesta foto?',
              categories.length > 0
                ? `Categories que ja existeixen a la casa: ${categories.join(', ')}.`
                : 'Encara no hi ha categories creades.',
              tags.length > 0 ? `Etiquetes ja usades: ${tags.join(', ')}.` : '',
            ]
              .filter((line) => line.length > 0)
              .join('\n'),
          },
        ],
      },
    ],
  })

  if (response.stop_reason === 'refusal') {
    throw new Error('La IA no ha pogut processar aquesta imatge')
  }

  return response.parsed_output?.objectes ?? []
}
