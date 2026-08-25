/**
 * Tradueix els errors d'autenticacio de Supabase.
 *
 * Arriben en angles i en jerga ("For security purposes, you can only request
 * this after 39 seconds"), que a la persona que nomes vol entrar a mirar on es
 * el martell no li diu res. Aqui es converteixen en una frase que explica que
 * ha passat i, sobretot, que ha de fer.
 *
 * La comparacio es fa sobre el text i no sobre un codi perque Supabase no en
 * dona cap d'estable per a aquests casos. Si cap patro encaixa, es retorna el
 * missatge original: val mes un text en angles que amagar la causa.
 */
export function missatgeAuth(original: string): string {
  const text = original.toLowerCase()

  const segons = text.match(/after (\d+) seconds?/)
  if (segons) {
    const n = Number(segons[1])
    return `Espera ${n} segon${n === 1 ? '' : 's'} i torna-ho a demanar. Es una proteccio contra l'enviament repetit de correus.`
  }

  if (text.includes('rate limit') || text.includes('too many requests')) {
    return 'S’han enviat massa correus en poca estona. Prova-ho d’aquí a una estona.'
  }
  // L'ordre importa: Supabase respon "Token has expired or is invalid" i
  // barreja els dos casos en un sol missatge, aixi que no es pot prometre a
  // la persona quin dels dos li ha passat. Es diuen tots dos i s'hi posa la
  // sortida, que es l'unica cosa que ha de fer en qualsevol dels dos casos.
  if (text.includes('expired') || (text.includes('invalid') && text.includes('token'))) {
    return 'Aquest codi no serveix: o ja ha caducat o no és el del correu més recent. Demana’n un de nou.'
  }
  if (text.includes('email') && (text.includes('invalid') || text.includes('valid'))) {
    return 'Aquesta adreça de correu no sembla correcta.'
  }
  if (text.includes('signups not allowed') || text.includes('signup is disabled')) {
    return 'Les altes noves estan desactivades en aquest garatge.'
  }
  if (text.includes('failed to fetch') || text.includes('network')) {
    return 'No hi ha connexió. Comprova la cobertura i torna-ho a provar.'
  }

  return original
}
