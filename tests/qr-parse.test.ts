import { describe, expect, it } from 'vitest'
import { extractLocationCode } from '@/lib/qr-parse'

/**
 * Aquesta funció és el pont entre l'adhesiu i l'app: si falla, escanejar no
 * porta enlloc i tot el sistema d'etiquetes deixa de tenir sentit.
 */
describe('extractLocationCode', () => {
  it('llegeix el codi de la URL que generem als QR', () => {
    expect(extractLocationCode('https://garatge.example.com/l/A2-P1-E3')).toBe('A2-P1-E3')
  })

  it('accepta una URL amb paràmetres o fragment darrere', () => {
    expect(extractLocationCode('https://garatge.example.com/l/A1-P2?from=qr')).toBe('A1-P2')
    expect(extractLocationCode('https://garatge.example.com/l/A1-P2#dalt')).toBe('A1-P2')
  })

  it('segueix funcionant si l’app canvia de domini', () => {
    // Els adhesius ja enganxats duen el domini antic imprès per sempre.
    expect(extractLocationCode('https://el-domini-vell.vercel.app/l/A3-P3-E1-C02')).toBe(
      'A3-P3-E1-C02',
    )
  })

  it('normalitza a majúscules', () => {
    expect(extractLocationCode('https://x.com/l/a2-p1')).toBe('A2-P1')
    expect(extractLocationCode('a2-p1')).toBe('A2-P1')
  })

  it('accepta el codi escrit a mà, sense URL', () => {
    expect(extractLocationCode('  A2-P1-E3  ')).toBe('A2-P1-E3')
  })

  it('descodifica el codi si ve escapat a la ruta', () => {
    expect(extractLocationCode('https://x.com/l/A2%2DP1')).toBe('A2-P1')
  })

  it('rebutja el que no és un codi d’ubicació', () => {
    expect(extractLocationCode('')).toBeNull()
    expect(extractLocationCode('   ')).toBeNull()
    expect(extractLocationCode('https://x.com/objectes/123')).toBeNull()
    expect(extractLocationCode('https://x.com/l/')).toBeNull()
    // Un QR de qualsevol altra cosa (una wifi, un pagament) no ha de navegar.
    expect(extractLocationCode('WIFI:S:CasaMeva;T:WPA;P:12345;;')).toBeNull()
    expect(extractLocationCode('A')).toBeNull()
    expect(extractLocationCode('A2 P1')).toBeNull()
  })

  it('rebutja codis massa llargs', () => {
    expect(extractLocationCode('A' + '1'.repeat(40))).toBeNull()
  })
})
