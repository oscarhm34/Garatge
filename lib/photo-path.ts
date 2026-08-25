export const PHOTO_BUCKET = 'fotos'

/**
 * Ruta on desar la foto d'un objecte o d'una ubicació.
 *
 * Viu en un mòdul propi, separat de lib/db/photos.ts, perquè el navegador
 * l'ha de fer servir per pujar la foto i aquell fitxer importa el client de
 * servidor (i, amb ell, next/headers).
 */
export function photoPath(
  householdId: string,
  kind: 'items' | 'locations',
  entityId: string,
  extension = 'webp',
): string {
  // La primera carpeta ha de ser el household_id: és el que comproven les
  // polítiques de storage.objects.
  return `${householdId}/${kind}/${entityId}-${Date.now()}.${extension}`
}
