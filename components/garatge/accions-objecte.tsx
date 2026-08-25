'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Hand, Loader2, MoveRight, MoreVertical, Trash2, Undo2 } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { apiDelete, apiPost } from '@/lib/fetcher'

interface Props {
  itemId: string
  itemName: string
  prestatA: string | null
  teUnPrestecObert: boolean
}

export function MenuObjecte({ itemId, itemName }: { itemId: string; itemName: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function esborrar() {
    // confirm() natiu: és destructiu i poc freqüent, i el diàleg del sistema
    // costa més de prémer sense voler.
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-11" aria-label={`Opcions de ${itemName}`}>
          <MoreVertical className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem variant="destructive" onSelect={esborrar} disabled={pending}>
          <Trash2 />
          Esborrar de l&apos;inventari
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
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
            {pending ? <Loader2 className="animate-spin" /> : <Hand />}
            Me l&apos;enduc jo
          </Button>
        )}

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
