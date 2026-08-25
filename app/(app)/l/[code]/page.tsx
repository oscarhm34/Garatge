import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Box, PackagePlus, QrCode } from 'lucide-react'
import { AfegirUbicacio } from '@/components/garatge/afegir-ubicacio'
import { ItemCard } from '@/components/garatge/item-card'
import { LocationBreadcrumb } from '@/components/garatge/location-breadcrumb'
import { Button } from '@/components/ui/button'
import { getItemsInLocation } from '@/lib/db/items'
import {
  defaultChildKind,
  getBreadcrumb,
  getChildren,
  getLocationByCode,
  KIND_LABEL,
} from '@/lib/db/locations'
import { signPhotos } from '@/lib/db/photos'

/**
 * Destí de tots els QR.
 *
 * El codi de la URL és el que hi ha imprès a l'adhesiu (A2-P1-E3), de manera que
 * la càmera nativa del mòbil ja hi porta sense haver d'obrir l'app abans. Si no
 * hi ha sessió, proxy.ts desvia al login guardant aquesta ruta i hi torna
 * després: un QR trobat al carrer no ensenya res de casa.
 */
export async function generateMetadata({ params }: PageProps<'/l/[code]'>) {
  const { code } = await params
  const location = await getLocationByCode(code)
  return { title: location?.name ?? 'Ubicació' }
}

export default async function UbicacioPage({ params }: PageProps<'/l/[code]'>) {
  const { code } = await params
  const location = await getLocationByCode(code)
  if (!location) notFound()

  const [chain, children, items] = await Promise.all([
    getBreadcrumb(location.id),
    getChildren(location.id),
    getItemsInLocation(location.id),
  ])

  const fotos = await signPhotos(items.map((item) => item.photo_url))
  const childKind = defaultChildKind(location.kind)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <LocationBreadcrumb chain={chain} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{location.name}</h1>
            <p className="text-muted-foreground font-mono text-xs">{location.code}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/etiquetes?codi=${location.code}`}>
              <QrCode />
              Etiqueta
            </Link>
          </Button>
        </div>
      </div>

      <Button asChild size="lg">
        <Link href={`/objectes/nou?ubicacio=${location.id}`}>
          <PackagePlus />
          Guardar una cosa aquí
        </Link>
      </Button>

      {children.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-sm font-medium">
            {KIND_LABEL[childKind]}s
          </h2>
          <ul className="grid grid-cols-2 gap-2">
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/l/${child.code}`}
                  className="hover:bg-accent hover:border-primary flex items-center gap-3 rounded-lg border p-3 transition-colors"
                  style={child.color ? { borderLeftColor: child.color, borderLeftWidth: 4 } : undefined}
                >
                  <Box className="text-muted-foreground size-5 shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{child.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {child.item_count_deep}{' '}
                      {child.item_count_deep === 1 ? 'objecte' : 'objectes'}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AfegirUbicacio
        parentId={location.id}
        kind={childKind}
        kindLabel={KIND_LABEL[childKind]}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground text-sm font-medium">
          {items.length === 0
            ? 'Aquí no hi ha res desat directament'
            : `Aquí hi ha ${items.length} ${items.length === 1 ? 'cosa' : 'coses'}`}
        </h2>
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <ItemCard
                item={item}
                photoUrl={item.photo_url ? fotos.get(item.photo_url) : undefined}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
