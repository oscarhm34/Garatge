'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, MoreVertical, Pencil, QrCode, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiDelete, apiPatch } from '@/lib/fetcher'

interface Props {
  id: string
  nom: string
  codi: string
  /** Quantes coses hi ha a dins, comptant els espais de sota. */
  contingut: number
  /** Codi del pare, per tornar-hi despres d'esborrar. */
  codiPare: string | null
  potEsborrar: boolean
}

/**
 * Reanomenar i esborrar una ubicacio.
 *
 * Existeix perque muntar el garatge s'encerta a la segona: obres un armari,
 * veus que el que havies apuntat com tres portes son dos espais, i has de
 * poder-ho arreglar tu mateix des de davant del moble.
 */
export function GestionarUbicacio({ id, nom, codi, contingut, codiPare, potEsborrar }: Props) {
  const router = useRouter()
  const [reanomenant, setReanomenant] = useState(false)
  const [nomNou, setNomNou] = useState(nom)
  const [pending, setPending] = useState(false)

  async function reanomenar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      await apiPatch(`/api/ubicacions/${id}`, { nom: nomNou.trim() })
      toast.success('Reanomenat')
      setReanomenant(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No s’ha pogut reanomenar')
    } finally {
      setPending(false)
    }
  }

  async function esborrar() {
    // El text diu exactament que se n'endu, amb el nombre real. "N'estàs
    // segur?" no dona cap informacio nova; "s'emportara 14 coses" si.
    const avis =
      contingut > 0
        ? `Vols esborrar «${nom}»? S’emportarà els espais de sota, i les ${contingut} coses que hi ha es quedaran sense lloc assignat.`
        : `Vols esborrar «${nom}»? Està buit.`
    if (!window.confirm(avis)) return

    setPending(true)
    try {
      await apiDelete(`/api/ubicacions/${id}`)
      toast.success(`${nom} esborrat`)
      router.push(codiPare === null ? '/mapa' : `/l/${codiPare}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No s’ha pogut esborrar')
      setPending(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-11" aria-label={`Opcions de ${nom}`}>
            <MoreVertical className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/etiquetes?codi=${codi}`}>
              <QrCode />
              Imprimir l&apos;etiqueta
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setNomNou(nom)
              setReanomenant(true)
            }}
          >
            <Pencil />
            Canviar el nom
          </DropdownMenuItem>
          {potEsborrar ? (
            <DropdownMenuItem variant="destructive" onSelect={esborrar} disabled={pending}>
              <Trash2 />
              Esborrar
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reanomenant} onOpenChange={setReanomenant}>
        <DialogContent>
          <form onSubmit={reanomenar}>
            <DialogHeader>
              <DialogTitle>Canviar el nom</DialogTitle>
              <DialogDescription>
                El codi <span className="codi">{codi}</span> no canvia, així que els adhesius que
                ja has enganxat segueixen servint.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 py-4">
              <Label htmlFor="nom-ubicacio">Nom</Label>
              <Input
                id="nom-ubicacio"
                required
                maxLength={80}
                autoFocus
                value={nomNou}
                onChange={(event) => setNomNou(event.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                size="lg"
                disabled={pending || nomNou.trim().length === 0 || nomNou.trim() === nom}
              >
                {pending ? <Loader2 className="animate-spin" /> : null}
                Desar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
