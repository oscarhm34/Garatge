/**
 * Identitat de color de cada armari.
 *
 * Els colors surten del codi de colors de les resistencies (marro 1, vermell 2,
 * taronja 3...), que es la manera que ja te el taller de convertir numeros en
 * colors. Se salta el groc, reservat per a les accions de la interficie.
 *
 * No es decoracio: el mateix color va a la pantalla i a la banda de l'adhesiu
 * imprès, de manera que s'apren "el vermell" sense haver de llegir cap codi.
 */
const COLORS = [
  '#96603a', // 1 marro
  '#c4342b', // 2 vermell
  '#e0761f', // 3 taronja
  '#3e9757', // 4 verd
  '#2f6fb5', // 5 blau
  '#7c5bc4', // 6 violeta
] as const

/**
 * Codi de l'armari a partir del d'una ubicacio qualsevol.
 *
 * Es pot llegir del propi codi perque son jerarquics per construccio:
 * add_location() sempre hi posa el del pare al davant, i la base de dades ho
 * garanteix amb una restriccio d'unicitat. Aixi no cal pujar per l'arbre.
 */
export function codiArmari(code: string): string {
  return code.split('-')[0] ?? code
}

/** Color de l'armari al qual pertany una ubicacio. */
export function colorArmari(code: string): string {
  const numero = Number(codiArmari(code).replace(/\D/g, ''))
  if (!Number.isFinite(numero) || numero < 1) return COLORS[0]
  return COLORS[(numero - 1) % COLORS.length]
}
