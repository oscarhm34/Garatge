import { createClient } from '@/lib/supabase/server'
import { PHOTO_BUCKET } from '@/lib/photo-path'

export { PHOTO_BUCKET, photoPath } from '@/lib/photo-path'

/** Una hora: prou perquè duri una sessió de guardar coses, prou poc perquè una
 *  URL copiada per error no serveixi de res demà. */
const SIGNED_URL_SECONDS = 60 * 60

/**
 * Converteix rutes del magatzem en URL signades.
 *
 * El bucket és privat perquè les fotos ensenyen l'interior de casa i el que hi
 * ha de valor a dins. Se signen totes de cop i no una per una: una llista de
 * trenta resultats faria trenta peticions.
 */
export async function signPhotos(paths: readonly (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((path): path is string => Boolean(path)))]
  if (unique.length === 0) return new Map()

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(unique, SIGNED_URL_SECONDS)

  if (error || !data) return new Map()

  const result = new Map<string, string>()
  for (const entry of data) {
    // createSignedUrls no falla en bloc: si una ruta concreta no existeix,
    // retorna aquella entrada amb error i la resta bones.
    if (entry.signedUrl && entry.path) result.set(entry.path, entry.signedUrl)
  }
  return result
}
