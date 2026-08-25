/**
 * Costat llarg màxim d'una foto abans d'enviar-la.
 *
 * 1568 px és el punt on Claude deixa de guanyar detall: per sobre, l'API la
 * redimensiona igualment i només s'hi ha perdut temps de pujada. Per a
 * l'emmagatzematge també és de sobres per reconèixer una eina en una llista.
 */
export const MAX_EDGE = 1568

export interface PreparedImage {
  /** Contingut en base64, sense el prefix data:. */
  base64: string
  /** Fitxer llest per pujar al magatzem. */
  blob: Blob
  mediaType: 'image/webp' | 'image/jpeg'
  width: number
  height: number
}

/**
 * Redimensiona i recomprimeix una foto al navegador.
 *
 * Es fa aquí i no al servidor perquè una foto de mòbil pesa entre 3 i 8 MB i
 * pujar-la sencera per una connexió de dades del garatge és el pas que fa
 * abandonar l'inventari a mitges. Un WebP de 1568 px en pesa uns 200 kB.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file)

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Aquest navegador no pot processar imatges')

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // WebP quan es pot; JPEG per als navegadors que encara no el generen.
  const webp = await toBlob(canvas, 'image/webp', 0.82)
  const blob = webp ?? (await toBlob(canvas, 'image/jpeg', 0.85))
  if (!blob) throw new Error('No s’ha pogut comprimir la foto')

  const mediaType = blob.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
  return { base64: await blobToBase64(blob), blob, mediaType, width, height }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      // Alguns navegadors ignoren el tipus demanat i tornen un PNG; comprovar-ho
      // evita desar un fitxer amb l'extensió equivocada.
      (blob) => resolve(blob && blob.type === type ? blob : null),
      type,
      quality,
    )
  })
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No s’ha pogut llegir la foto'))
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      // readAsDataURL retorna "data:image/webp;base64,XXXX"; l'API només vol XXXX.
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.readAsDataURL(blob)
  })
}
