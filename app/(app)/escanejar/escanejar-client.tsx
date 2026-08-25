'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { EscanerQr } from '@/components/garatge/escaner-qr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { extractLocationCode } from '@/lib/qr-parse'

export function EscanejarClient() {
  const router = useRouter()
  const [manual, setManual] = useState('')

  const anarA = useCallback(
    (code: string) => {
      // Vibració curta com a confirmació: al garatge sovint no se sent res i
      // la pantalla queda fora de l'angle de visió mentre s'apunta.
      if (typeof navigator.vibrate === 'function') navigator.vibrate(40)
      router.push(`/l/${code}`)
    },
    [router],
  )

  function anarAManual(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = extractLocationCode(manual)
    if (!code) {
      toast.error('Aquest codi no té el format correcte', { description: 'Per exemple: A2-P1-E3' })
      return
    }
    anarA(code)
  }

  return (
    <div className="flex flex-col gap-6">
      <EscanerQr onCode={anarA} hint="Enquadra el QR dins del requadre" />

      <form onSubmit={anarAManual} className="flex flex-col gap-2">
        <Label htmlFor="codi-manual">
          O escriu el codi que hi ha imprès sota el QR
        </Label>
        <div className="flex gap-2">
          <Input
            id="codi-manual"
            placeholder="A2-P1-E3"
            autoComplete="off"
            autoCapitalize="characters"
            className="font-mono uppercase"
            value={manual}
            onChange={(event) => setManual(event.target.value)}
          />
          <Button type="submit" disabled={manual.trim().length < 2}>
            Anar-hi
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Serveix quan l&apos;adhesiu està tacat o la càmera no hi arriba.
        </p>
      </form>
    </div>
  )
}
