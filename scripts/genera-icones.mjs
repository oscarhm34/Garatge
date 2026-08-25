/**
 * Genera les icones de l'app a partir de la il·lustracio.
 *
 *   node scripts/genera-icones.mjs
 *
 * El retall esta triat a ma: agafa l'armari obert amb les caixes etiquetades i
 * el mobil amb el dit a sobre, que es el que explica de que va l'app. Deixa
 * fora el rètol ORGANIZAPP del peu, perque a la mida real d'una icona el text
 * no es llegeix i nomes hi afegeix soroll.
 *
 * A 48 px la il·lustracio es una taca taronja calida; a 180-192 px, que es la
 * mida que fan servir de debo iOS i Android a la pantalla d'inici, es veu
 * sencera.
 */
import { mkdirSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const ORIGEN = join('assets', 'icona-original.jpg')
const DESTI = join('public', 'icones')

/** Retall quadrat de la il·lustracio original (912×1182). */
const RETALL = { left: 120, top: 250, width: 700, height: 700 }

/** Color de la paret de la il·lustracio, per als marges de la icona maskable. */
const FONS = '#f4dfc2'

mkdirSync(DESTI, { recursive: true })

const base = () => sharp(ORIGEN).extract(RETALL)

async function escriu(desti, imatge) {
  // palette: true quantitza a 256 colors. En una fotografia deixaria bandes
  // visibles, pero aixo es una il·lustracio de zones planes i tinta uniforme:
  // no s'hi nota i el fitxer baixa de mig mega a unes desenes de kB, que es la
  // diferencia entre una icona que carrega i una que no al garatge.
  await imatge.png({ palette: true, quality: 90, effort: 10 }).toFile(desti)
  const { size } = await stat(desti)
  console.log(`${desti} — ${(size / 1024).toFixed(0)} kB`)
}

for (const mida of [192, 512]) {
  await escriu(join(DESTI, `icona-${mida}.png`), base().resize(mida, mida))
}

/**
 * Versio maskable.
 *
 * Android retalla les icones amb la forma que toqui —cercle, quadrat rodo,
 * gota— i nomes garanteix el 80 % central. Sense aquest marge, el retall es
 * menjaria les portes de l'armari pels costats.
 */
const MASKABLE = 512
const INTERIOR = Math.round(MASKABLE * 0.78)
await escriu(
  join(DESTI, 'icona-maskable-512.png'),
  sharp({
    create: { width: MASKABLE, height: MASKABLE, channels: 3, background: FONS },
  }).composite([
    {
      input: await base().resize(INTERIOR, INTERIOR).png().toBuffer(),
      left: Math.round((MASKABLE - INTERIOR) / 2),
      top: Math.round((MASKABLE - INTERIOR) / 2),
    },
  ]),
)

/** iOS no fa servir el manifest per a la icona de la pantalla d'inici. */
await escriu(join('app', 'apple-icon.png'), base().resize(180, 180))

/** Icona de la pestanya del navegador. */
await escriu(join('app', 'icon.png'), base().resize(96, 96))
