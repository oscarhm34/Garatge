import Link from 'next/link'
import { DoorOpen, Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getChildren, getRootLocations } from '@/lib/db/locations'
import type { LocationDetail } from '@/lib/types/database'

export const metadata = { title: 'Mapa del garatge' }

/**
 * Mapa visual del garatge.
 *
 * Existeix per a qui no vol escriure ni escanejar res: els avis, la canalla, i
 * qualsevol el primer dia. Es veuen els armaris tal com estan a la paret i es va
 * tocant fins a trobar el que es busca.
 */
export default async function MapaPage() {
  const armaris = await getRootLocations()

  if (armaris.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">Encara no hi ha cap armari creat.</p>
        <Button asChild>
          <Link href="/ajustos">Configurar el garatge</Link>
        </Button>
      </div>
    )
  }

  const portesPerArmari = await Promise.all(armaris.map((armari) => getChildren(armari.id)))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Mapa del garatge</h1>
        <p className="text-muted-foreground text-sm">
          Toca una porta per veure què hi ha a dins.
        </p>
      </div>

      {armaris.map((armari, index) => (
        <Armari key={armari.id} armari={armari} portes={portesPerArmari[index] ?? []} />
      ))}
    </div>
  )
}

function Armari({ armari, portes }: { armari: LocationDetail; portes: LocationDetail[] }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-medium">
          {armari.name}
          <span className="text-muted-foreground ml-2 font-mono text-xs">{armari.code}</span>
        </h2>
        <span className="text-muted-foreground text-xs">
          {armari.item_count_deep} {armari.item_count_deep === 1 ? 'objecte' : 'objectes'}
        </span>
      </div>

      {/* Les portes es dibuixen en una fila, com estan al moble de veritat. */}
      <div className="grid grid-cols-3 gap-2">
        {portes.map((porta) => (
          <Link
            key={porta.id}
            href={`/l/${porta.code}`}
            className="hover:border-primary hover:bg-accent focus-visible:ring-ring group flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border-2 p-3 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
            style={porta.color ? { borderColor: porta.color } : undefined}
          >
            <DoorOpen className="text-muted-foreground group-hover:text-primary size-7" aria-hidden />
            <span className="text-sm leading-tight font-medium">{porta.name}</span>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Package className="size-3" aria-hidden />
              {porta.item_count_deep}
            </span>
          </Link>
        ))}

        {portes.length === 0 ? (
          <Button asChild variant="outline" className="col-span-3 h-20 border-dashed">
            <Link href={`/l/${armari.code}`}>
              <Plus />
              Afegir portes a {armari.name}
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  )
}
