'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiPost } from '@/lib/fetcher'
import type { LocationKind, LocationRow } from '@/lib/types/database'

interface Props {
  parentId: string
  kind: LocationKind
  /** Singular, plural i article del tipus; el catala els necessita tots tres. */
  vocab: { singular: string; plural: string; article: string }
}

/**
 * Alta d'un prestatge o d'una caixa dins de la ubicació actual.
 *
 * El nom es pot deixar en blanc: la base de dades en posa un de correlatiu
 * ("Prestatge 3"). Obligar a escriure un nom per cada prestatge faria que ningú
 * acabés de configurar el segon armari.
 */
export function AfegirUbicacio({ parentId, kind, vocab }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [nom, setNom] = useState('')
  const [pending, setPending] = useState(false)

  async function crear(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      const { ubicacio } = await apiPost<{ ubicacio: LocationRow }>('/api/ubicacions', {
        pare: parentId,
        tipus: kind,
        nom: nom.trim() === '' ? null : nom.trim(),
        color: null,
      })
      toast.success(`${ubicacio.name} creat`, { description: `Codi ${ubicacio.code}` })
      setNom('')
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No s’ha pogut crear')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="lg" className="text-muted-foreground h-12 w-full">
          <Plus />
          Afegir {vocab.article} {vocab.singular.toLowerCase()}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={crear}>
          <DialogHeader>
            <DialogTitle>Afegir {vocab.article} {vocab.singular.toLowerCase()}</DialogTitle>
            <DialogDescription>
              El codi del QR es genera sol a partir d&apos;on el crees.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 py-4">
            <Label htmlFor="nom-ubicacio">Nom (opcional)</Label>
            <Input
              id="nom-ubicacio"
              maxLength={80}
              placeholder={kind === 'caixa' ? 'Caixa blava dels cargols' : 'Prestatge de dalt'}
              value={nom}
              onChange={(event) => setNom(event.target.value)}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel·lar
              </Button>
            </DialogClose>
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
