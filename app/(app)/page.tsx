import Link from 'next/link'
import { HandCoins, Plus, ScanLine, Sparkles } from 'lucide-react'
import { Cercador } from '@/components/garatge/cercador'
import { ItemCard } from '@/components/garatge/item-card'
import { Button } from '@/components/ui/button'
import { getBorrowedItems, countItems, getRecentItems } from '@/lib/db/items'
import { signPhotos } from '@/lib/db/photos'

export const metadata = { title: 'Cercar' }

export default async function InicPage() {
  const [recents, prestats, total] = await Promise.all([
    getRecentItems(8),
    getBorrowedItems(),
    countItems(),
  ])

  const fotos = await signPhotos([...recents, ...prestats].map((item) => item.photo_url))

  return (
    <Cercador>
      <div className="flex flex-col gap-6 pt-2">
        {total === 0 ? <PrimerPas /> : null}

        {prestats.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <HandCoins className="size-4" aria-hidden />
              Ara mateix ho té algú
            </h2>
            <ul className="flex flex-col gap-2">
              {prestats.map((item) => (
                <li key={item.id}>
                  <ItemCard
                    item={item}
                    photoUrl={item.photo_url ? fotos.get(item.photo_url) : undefined}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {recents.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-muted-foreground text-sm font-medium">Afegits últimament</h2>
            <ul className="flex flex-col gap-2">
              {recents.map((item) => (
                <li key={item.id}>
                  <ItemCard
                    item={item}
                    photoUrl={item.photo_url ? fotos.get(item.photo_url) : undefined}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {total > 0 ? (
          <p className="text-muted-foreground pb-2 text-center text-xs">
            {total} {total === 1 ? 'objecte inventariat' : 'objectes inventariats'}
          </p>
        ) : null}
      </div>
    </Cercador>
  )
}

/** Pantalla d'inici quan encara no hi ha res desat. */
function PrimerPas() {
  return (
    <div className="bg-muted/40 flex flex-col items-center gap-4 rounded-xl border border-dashed p-6 text-center">
      <Sparkles className="text-primary size-8" aria-hidden />
      <div>
        <h2 className="font-medium">El garatge encara és buit</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Imprimeix les etiquetes, enganxa-les a les portes i comença a inventariar. Pots fer una
          foto d&apos;un prestatge sencer i deixar que et proposi què hi ha.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/objectes/nou">
            <Plus />
            Afegir un objecte
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/escanejar">
            <ScanLine />
            Escanejar un QR
          </Link>
        </Button>
      </div>
    </div>
  )
}
