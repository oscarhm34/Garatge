import { describe, expect, it } from 'vitest'
import { missatgeAuth } from '@/lib/auth-errors'

describe('missatgeAuth', () => {
  it('explica l’espera entre enviaments amb els segons que toquen', () => {
    const resultat = missatgeAuth('For security purposes, you can only request this after 39 seconds.')
    expect(resultat).toContain('39 segons')
    expect(resultat).not.toContain('security purposes')
  })

  it('posa el singular quan queda un segon', () => {
    expect(missatgeAuth('you can only request this after 1 second')).toContain('1 segon i')
  })

  it('tradueix el límit d’enviaments', () => {
    expect(missatgeAuth('Email rate limit exceeded')).toContain('massa correus')
  })

  /**
   * Supabase no distingeix un codi caducat d'un d'incorrecte: respon
   * "Token has expired or is invalid" per als dos. El missatge ho ha de
   * reflectir en comptes d'afirmar una de les dues coses a l'atzar.
   */
  it('no promet quin dels dos problemes hi ha amb el codi', () => {
    for (const cru of ['Token has expired or is invalid', 'Invalid token', 'OTP expired']) {
      const resultat = missatgeAuth(cru)
      expect(resultat).toContain('caducat')
      expect(resultat).toContain('Demana')
    }
  })

  it('avisa quan no hi ha connexió', () => {
    expect(missatgeAuth('Failed to fetch')).toContain('connexió')
  })

  /**
   * Preferible a amagar la causa: si apareix un error que no coneixem, val més
   * ensenyar-lo en anglès que dir "hi ha hagut un problema" i deixar la persona
   * (i qui l'ajudi) sense cap pista.
   */
  it('deixa passar els errors que no reconeix', () => {
    expect(missatgeAuth('Something completely new')).toBe('Something completely new')
  })
})
