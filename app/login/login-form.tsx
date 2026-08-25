'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

type Step = 'email' | 'codi'

/**
 * La llargada del codi la decideix Supabase (Authentication → Emails), i de
 * sèrie no són sis xifres sinó vuit. Aquí s'accepta un interval en comptes
 * d'un número fix: si algú canvia aquell ajust al panell, l'entrada a l'app
 * no es trenca en silenci.
 */
const LONGITUD_MINIMA = 6
const LONGITUD_MAXIMA = 10

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [codi, setCodi] = useState('')
  const [pending, setPending] = useState(false)

  async function enviarCodi(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}` },
    })
    setPending(false)

    if (error) {
      toast.error('No s\u2019ha pogut enviar el codi', { description: error.message })
      return
    }
    setStep('codi')
    toast.success('Codi enviat', { description: `Mira el correu de ${email.trim()}` })
  }

  async function verificarCodi(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: codi.trim(),
      type: 'email',
    })
    setPending(false)

    if (error) {
      toast.error('Codi incorrecte', { description: error.message })
      return
    }
    // refresh() abans de push() perquè el servidor torni a llegir la galeta nova;
    // si no, la primera pàgina encara es renderitzaria com si no hi hagués sessió.
    router.refresh()
    router.push(next)
  }

  return (
    <Card className="w-full max-w-sm">
      {step === 'email' ? (
        <>
          <CardHeader>
            <CardTitle>Entra amb el teu correu</CardTitle>
            <CardDescription>
              T&apos;enviem un codi al correu. No cal recordar cap contrasenya.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={enviarCodi} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Correu electrònic</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  required
                  placeholder="tu@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={pending || email.trim().length === 0}>
                {pending ? <Loader2 className="animate-spin" /> : <Mail />}
                Envia&apos;m el codi
              </Button>
            </form>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader>
            <CardTitle>Escriu el codi</CardTitle>
            <CardDescription>Hem enviat un codi a {email}.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={verificarCodi} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="codi">Codi</Label>
                <Input
                  id="codi"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  maxLength={LONGITUD_MAXIMA}
                  placeholder="000000"
                  className="text-center font-mono text-2xl tracking-[0.4em]"
                  value={codi}
                  onChange={(e) => setCodi(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <Button type="submit" disabled={pending || codi.length < LONGITUD_MINIMA}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                Entra
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep('email')} disabled={pending}>
                Fer servir un altre correu
              </Button>
            </form>
          </CardContent>
        </>
      )}
    </Card>
  )
}
