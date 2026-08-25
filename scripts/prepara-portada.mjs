/**
 * Prepara la il·lustracio de portada per a web.
 *
 * L'original es un JPEG de WhatsApp de 334 kB. Servir-lo tal qual voldria dir
 * que la primera pantalla de l'app costa un terc de mega cada cop que algu hi
 * entra des de dades mobils al garatge, que es justament on la cobertura es
 * pitjor.
 *
 * El resultat es versiona al repositori, aixi que aixo nomes cal tornar-ho a
 * executar si es canvia la il·lustracio:
 *
 *   node scripts/prepara-portada.mjs
 */
import { mkdirSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const ORIGEN = join('assets', 'portada-original.jpeg')
const DESTI = join('public', 'portada')

mkdirSync(DESTI, { recursive: true })

const original = await sharp(ORIGEN).metadata()
console.log(`original: ${original.width}×${original.height}`)

/**
 * Dues amplades i prou.
 *
 * 912 px cobreix un mobil de 390 px a 2x llargament, i 480 px estalvia dades
 * a qui te la pantalla petita o la connexio dolenta. Mes variants no es
 * notarien i afegirien fitxers a mantenir.
 */
const AMPLADES = [912, 480]

for (const amplada of AMPLADES) {
  const desti = join(DESTI, `portada-${amplada}.webp`)
  await sharp(ORIGEN)
    .resize({ width: amplada, withoutEnlargement: true })
    // Es una il·lustracio de traç net amb zones planes: el WebP hi treballa
    // molt millor que el JPEG i a qualitat 80 no s'hi veu la diferencia.
    .webp({ quality: 80, effort: 6 })
    .toFile(desti)

  const { size } = await stat(desti)
  console.log(`${desti} — ${(size / 1024).toFixed(0)} kB`)
}
