import Link from 'next/link'
import { Hand, Plus, ScanLine } from 'lucide-react'
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
            <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
              <Hand className="size-4" aria-hidden />
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
            <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Afegits últimament</h2>
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
    <div className="bg-card flex flex-col gap-4 rounded-lg border border-dashed p-5">
      <div>
        <h2 className="text-lg font-bold">Comença pel primer armari</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Imprimeix les etiquetes i enganxa-les. A partir d&apos;aquí, cada cosa que guardis:
          escaneja el lloc i digues què hi deixes.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button asChild size="lg" className="h-14">
          <Link href="/etiquetes">
            <Plus />
            Imprimir les etiquetes
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-14">
          <Link href="/escanejar">
            <ScanLine />
            Escanejar un QR
          </Link>
        </Button>
      </div>
    </div>
  )
}
