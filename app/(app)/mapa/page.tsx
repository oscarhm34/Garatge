import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { colorArmari } from '@/lib/armari'
import { getChildren, getRootLocations } from '@/lib/db/locations'
import { cn } from '@/lib/utils'
import type { LocationDetail } from '@/lib/types/database'

export const metadata = { title: 'Mapa del garatge' }

/**
 * Mapa del garatge.
 *
 * Es per a qui no vol escriure ni escanejar res: els avis, la canalla i
 * qualsevol el primer dia. Es veuen els armaris tal com estan a la paret i es
 * va tocant fins a trobar el que es busca.
 *
 * Cada armari duu el seu color, el mateix que porta l'adhesiu enganxat al
 * moble. Al cap de dues setmanes ningu no llegeix "Armari 2": es va al vermell.
 */
export default async function MapaPage() {
  const armaris = await getRootLocations()

  if (armaris.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">Encara no hi ha cap armari creat.</p>
        <Button asChild size="lg">
          <Link href="/ajustos">Configurar el garatge</Link>
        </Button>
      </div>
    )
  }

  const espaisPerArmari = await Promise.all(armaris.map((armari) => getChildren(armari.id)))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">El garatge</h1>
        <p className="text-muted-foreground text-sm">Toca un espai per veure què hi ha a dins.</p>
      </div>

      {armaris.map((armari, index) => (
        <Armari key={armari.id} armari={armari} espais={espaisPerArmari[index] ?? []} />
      ))}
    </div>
  )
}

function Armari({ armari, espais }: { armari: LocationDetail; espais: LocationDetail[] }) {
  const color = colorArmari(armari.code)

  return (
    <section className="bg-card overflow-hidden rounded-lg border">
      <Link
        href={`/l/${armari.code}`}
        className="hover:bg-accent flex items-center gap-3 border-b transition-colors"
      >
        <div className="w-2.5 self-stretch" style={{ backgroundColor: color }} aria-hidden />
        <div className="min-w-0 flex-1 py-3">
          <p className="truncate font-bold">{armari.name}</p>
          <p className="codi text-foreground/75 text-xs">{armari.code}</p>
        </div>
        {armari.item_count_deep > 0 ? (
          <span className="text-muted-foreground pr-4 text-sm">
            {armari.item_count_deep} {armari.item_count_deep === 1 ? 'cosa' : 'coses'}
          </span>
        ) : (
          <span className="text-muted-foreground pr-4 text-sm">Buit</span>
        )}
      </Link>

      {espais.length === 0 ? (
        <div className="p-3">
          <Button asChild variant="outline" className="h-16 w-full border-dashed">
            <Link href={`/l/${armari.code}`}>
              <Plus />
              Afegir espais a {armari.name}
            </Link>
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'grid gap-px p-px',
            // Les columnes segueixen els espais reals del moble: dos
            // compartiments es dibuixen com dos, no com una llista.
            espais.length === 1 && 'grid-cols-1',
            espais.length === 2 && 'grid-cols-2',
            espais.length >= 3 && 'grid-cols-3',
          )}
        >
          {espais.map((espai) => (
            <Link
              key={espai.id}
              href={`/l/${espai.code}`}
              className="hover:bg-accent focus-visible:ring-ring flex min-h-24 flex-col justify-center gap-1 p-3 text-center transition-transform active:scale-[0.97] focus-visible:ring-2 focus-visible:outline-none focus-visible:-outline-offset-2"
            >
              <span className="leading-tight font-semibold">{espai.name}</span>
              <span className="codi text-foreground/75 text-xs">{espai.code}</span>
              <span className="text-muted-foreground text-xs">
                {espai.item_count_deep === 0
                  ? 'Buit'
                  : `${espai.item_count_deep} ${espai.item_count_deep === 1 ? 'cosa' : 'coses'}`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
