'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { HandCoins, Loader2, MoveRight, Trash2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { EscanerQr } from '@/components/garatge/escaner-qr'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiDelete, apiPost } from '@/lib/fetcher'

interface Props {
  itemId: string
  itemName: string
  prestatA: string | null
  teUnPrestecObert: boolean
}

export function AccionsObjecte({ itemId, itemName, prestatA, teUnPrestecObert }: Props) {
  const router = useRouter()
  const [moving, setMoving] = useState(false)
  const [pending, setPending] = useState(false)

  /**
   * Moure. Aquest és el flux que decideix si l'app es fa servir o no: obrir la
   * fitxa, prémer Moure, escanejar l'adhesiu del nou lloc. No hi ha cap
   * desplegable amb quaranta ubicacions per triar.
   */
  async function moureA(code: string) {
    setPending(true)
    try {
      const { cami } = await apiPost<{ cami: string | null }>(`/api/objectes/${itemId}/moure`, {
        codi: code,
      })
      setMoving(false)
      toast.success(`${itemName} mogut`, { description: cami ?? undefined })
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No s’ha pogut moure')
    } finally {
      setPending(false)
    }
  }

  async function agafar() {
    setPending(true)
    try {
      await apiPost(`/api/objectes/${itemId}/prestec`, { nota: null })
      toast.success('Apuntat', { description: 'Quan el tornis, marca-ho aquí mateix.' })
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No s’ha pogut apuntar')
    } finally {
      setPending(false)
    }
  }

  async function tornar() {
    setPending(true)
    try {
      await apiDelete(`/api/objectes/${itemId}/prestec`)
      toast.success('Tornat al seu lloc')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No s’ha pogut registrar')
    } finally {
      setPending(false)
    }
  }

  async function esborrar() {
    // confirm() natiu i no un diàleg propi: és una acció destructiva i poc
    // freqüent, i el diàleg del sistema costa més de prémer sense voler.
    if (!window.confirm(`Vols esborrar «${itemName}» de l’inventari?`)) return
    setPending(true)
    try {
      await apiDelete(`/api/objectes/${itemId}`)
      toast.success('Esborrat')
      router.push('/')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No s’ha pogut esborrar')
      setPending(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Button onClick={() => setMoving(true)} disabled={pending} size="lg" className="h-16 text-base">
          <MoveRight />
          Moure a un altre lloc
        </Button>

        {teUnPrestecObert ? (
          <Button onClick={tornar} disabled={pending} variant="secondary" size="lg" className="h-16 text-base">
            {pending ? <Loader2 className="animate-spin" /> : <Undo2 />}
            {prestatA ? `Ja l’ha tornat ${prestatA}` : 'Ja està tornat'}
          </Button>
        ) : (
          <Button onClick={agafar} disabled={pending} variant="secondary" size="lg" className="h-16 text-base">
            {pending ? <Loader2 className="animate-spin" /> : <HandCoins />}
            Me l&apos;enduc jo
          </Button>
        )}

        <Button onClick={esborrar} disabled={pending} variant="ghost" className="text-destructive h-12">
          <Trash2 />
          Esborrar de l&apos;inventari
        </Button>
      </div>

      <Dialog open={moving} onOpenChange={setMoving}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>On el guardes?</DialogTitle>
            <DialogDescription>
              Escaneja el QR del prestatge o de la caixa on el deixes.
            </DialogDescription>
          </DialogHeader>
          {moving ? <EscanerQr onCode={moureA} /> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
