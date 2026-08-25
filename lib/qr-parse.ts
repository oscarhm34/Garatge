/** Format dels codis d'ubicació, el mateix que valida el CHECK de la taula. */
const CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{1,31}$/

/**
 * Treu el codi d'ubicació d'allò que ha llegit la càmera.
 *
 * S'accepten tres formes perquè els QR sobreviuen a canvis de domini: la URL
 * completa que generem avui, una URL d'un domini antic amb el mateix camí /l/,
 * i el codi pelat. Si un dia l'app canvia d'adreça, els adhesius ja enganxats
 * segueixen funcionant en escanejar-los des de dins de l'app.
 */
export function extractLocationCode(scanned: string): string | null {
  const text = scanned.trim()
  if (text.length === 0) return null

  try {
    const url = new URL(text)
    const match = url.pathname.match(/\/l\/([^/?#]+)/i)
    if (match?.[1]) {
      const code = decodeURIComponent(match[1]).toUpperCase()
      return CODE_PATTERN.test(code) ? code : null
    }
    return null
  } catch {
    // No era una URL: pot ser el codi escrit directament.
    const code = text.toUpperCase()
    return CODE_PATTERN.test(code) ? code : null
  }
}
