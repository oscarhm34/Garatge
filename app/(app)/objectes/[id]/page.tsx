import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { AccionsObjecte } from '@/components/garatge/accions-objecte'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getItemActivity } from '@/lib/db/activity'
import { getItem } from '@/lib/db/items'
import { signPhotos } from '@/lib/db/photos'
import type { ActivityAction } from '@/lib/types/database'

export async function generateMetadata({ params }: PageProps<'/objectes/[id]'>) {
  const { id } = await params
  const item = await getItem(id)
  return { title: item?.name ?? 'Objecte' }
}

export default async function ObjectePage({ params }: PageProps<'/objectes/[id]'>) {
  const { id } = await params
  const item = await getItem(id)
  if (!item) notFound()

  const [fotos, historial] = await Promise.all([
    signPhotos([item.photo_url]),
    getItemActivity(item.id, 12),
  ])
  const foto = item.photo_url ? fotos.get(item.photo_url) : undefined

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-4">
        <div className="bg-muted flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl">
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL signada de durada curta
            <img src={foto} alt={item.name} className="size-full object-cover" />
          ) : (
            <Package className="text-muted-foreground size-9" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl leading-tight font-semibold">{item.name}</h1>
          {item.quantity > 1 ? (
            <p className="text-muted-foreground text-sm">{item.quantity} unitats</p>
          ) : null}

          {item.location_id ? (
            <Link
              href={`/l/${item.location_code}`}
              className="text-primary mt-1 block text-sm hover:underline"
            >
              {item.location_path}
            </Link>
          ) : (
            <p className="text-muted-foreground mt-1 text-sm">Sense lloc assignat</p>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.category_name ? (
              <Badge
                variant="secondary"
                style={item.category_color ? { borderColor: item.category_color } : undefined}
              >
                {item.category_name}
              </Badge>
            ) : null}
            {item.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {item.description ? <p className="text-sm">{item.description}</p> : null}
      {item.notes ? (
        <p className="text-muted-foreground bg-muted/50 rounded-lg p-3 text-sm">{item.notes}</p>
      ) : null}

      <AccionsObjecte
        itemId={item.id}
        itemName={item.name}
        prestatA={item.borrowed_by_name}
        teUnPrestecObert={item.open_loan_id !== null}
      />

      {historial.length > 0 ? (
        <section className="flex flex-col gap-2">
          <Separator />
          <h2 className="text-muted-foreground text-sm font-medium">Historial</h2>
          <ol className="flex flex-col gap-1.5">
            {historial.map((entry) => (
              <li key={entry.id} className="text-muted-foreground flex gap-2 text-xs">
                <time dateTime={entry.created_at} className="shrink-0 font-mono">
                  {new Date(entry.created_at).toLocaleDateString('ca-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                  })}
                </time>
                <span>{ACTION_LABEL[entry.action]}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  )
}

const ACTION_LABEL: Record<ActivityAction, string> = {
  create: 'Es va afegir a l’inventari',
  update: 'Se’n van canviar les dades',
  move: 'Va canviar de lloc',
  delete: 'Es va esborrar',
  borrow: 'Algú se’l va endur',
  return: 'Va tornar al seu lloc',
}
