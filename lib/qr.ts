import QRCode from 'qrcode'
import { siteUrl } from '@/lib/env'

/**
 * URL que va dins del QR d'una ubicació.
 *
 * És una adreça web normal i corrent, no un esquema propi: així la càmera del
 * mòbil ja l'obre sense haver d'instal·lar ni obrir res abans. És la diferència
 * entre que la família ho faci servir o que no.
 */
export function locationUrl(code: string): string {
  return `${siteUrl()}/l/${code.toUpperCase()}`
}

/**
 * QR en SVG, per imprimir.
 *
 * Vectorial i no PNG perquè les etiquetes són petites (uns 15 mm de costat) i
 * un bitmap escalat a la impressora surt amb els mòduls borrosos, que és
 * exactament el que fa que un lector no l'enganxi al primer intent.
 *
 * Correcció d'errors M (~15%): l'adhesiu viu en un garatge i acabarà tocat de
 * greix o ratllat, però pujar a Q faria el dibuix més dens i pitjor de llegir
 * en una etiqueta tan petita.
 */
export async function qrSvg(code: string, sizePx = 120): Promise<string> {
  return QRCode.toString(locationUrl(code), {
    type: 'svg',
    margin: 0,
    width: sizePx,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFF' },
  })
}

/** Genera els QR de moltes ubicacions alhora. */
export async function qrSvgBatch(
  codes: readonly string[],
  sizePx = 120,
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    codes.map(async (code) => [code, await qrSvg(code, sizePx)] as const),
  )
  return new Map(entries)
}
