import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PackagePlus } from 'lucide-react'
import { AfegirUbicacio } from '@/components/garatge/afegir-ubicacio'
import { GestionarUbicacio } from '@/components/garatge/gestionar-ubicacio'
import { ItemCard } from '@/components/garatge/item-card'
import { LocationBreadcrumb } from '@/components/garatge/location-breadcrumb'
import { Placa } from '@/components/garatge/placa'
import { Button } from '@/components/ui/button'
import { colorArmari } from '@/lib/armari'
import { getItemsInLocation } from '@/lib/db/items'
import {
  defaultChildKind,
  getBreadcrumb,
  getChildren,
  getLocationByCode,
  KIND_VOCAB,
} from '@/lib/db/locations'
import { signPhotos } from '@/lib/db/photos'
import { requireHousehold } from '@/lib/db/session'

/**
 * Desti de tots els QR.
 *
 * El codi de la URL es el que hi ha imprès a l'adhesiu (A2-M1-E3), de manera
 * que la camera nativa del mobil ja hi porta sense obrir l'app abans. Si no hi
 * ha sessio, proxy.ts desvia al login guardant aquesta ruta i hi torna despres:
 * un QR trobat al carrer no ensenya res de casa.
 */
export async function generateMetadata({ params }: PageProps<'/l/[code]'>) {
  const { code } = await params
  const location = await getLocationByCode(code)
  return { title: location?.name ?? 'Ubicació' }
}

export default async function UbicacioPage({ params }: PageProps<'/l/[code]'>) {
  const { code } = await params
  const [location, { profile }] = await Promise.all([getLocationByCode(code), requireHousehold()])
  if (!location) notFound()

  const [chain, children, items] = await Promise.all([
    getBreadcrumb(location.id),
    getChildren(location.id),
    getItemsInLocation(location.id),
  ])

  const fotos = await signPhotos(items.map((item) => item.photo_url))
  const childKind = defaultChildKind(location.kind)
  const vocab = KIND_VOCAB[childKind]
  const color = colorArmari(location.code)
  const pare = chain.length > 1 ? chain[chain.length - 2] : null

  // El titol ja diu on ets; la placa nomes ha de dir d'on penja.
  const camiAncestres =
    chain.length > 1 ? chain.slice(0, -1).map((node) => node.name).join(' · ') : null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <LocationBreadcrumb chain={chain} />

        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl leading-tight font-bold">{location.name}</h1>
            <Placa codi={location.code} cami={camiAncestres} className="mt-2" />
          </div>
          <GestionarUbicacio
            id={location.id}
            nom={location.name}
            codi={location.code}
            contingut={location.item_count_deep}
            codiPare={pare?.code ?? null}
            potEsborrar={profile.role === 'admin'}
          />
        </div>
      </div>

      {/* L'accio principal es la primera cosa que es toca en escanejar un QR:
          s'esta plantat davant de l'armari obert, amb la cosa a la ma. */}
      <Button asChild size="lg" className="h-16 text-base">
        <Link href={`/objectes/nou?ubicacio=${location.id}`}>
          <PackagePlus className="size-5" />
          Guardar una cosa aquí
        </Link>
      </Button>

      {children.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            {vocab.plural}
          </h2>
          <ul className="grid grid-cols-2 gap-2">
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/l/${child.code}`}
                  className="bg-card hover:border-foreground/30 flex min-h-20 items-stretch gap-3 overflow-hidden rounded-lg border transition-transform active:scale-[0.97]"
                >
                  <div
                    className="w-1.5 shrink-0"
                    style={{ backgroundColor: child.color ?? color }}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-col justify-center py-2 pr-2">
                    <p className="truncate font-semibold">{child.name}</p>
                    <p className="codi text-muted-foreground truncate text-xs">{child.code}</p>
                    {child.item_count_deep > 0 ? (
                      <p className="text-muted-foreground text-xs">
                        {child.item_count_deep} {child.item_count_deep === 1 ? 'cosa' : 'coses'}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AfegirUbicacio parentId={location.id} kind={childKind} vocab={vocab} />

      <section className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aquí encara no hi ha res desat directament.
          </p>
        ) : (
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            {items.length} {items.length === 1 ? 'cosa' : 'coses'} aquí
          </h2>
        )}
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
