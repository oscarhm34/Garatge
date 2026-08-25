import { notFound } from 'next/navigation'
import { LocationBreadcrumb } from '@/components/garatge/location-breadcrumb'
import { getCategories } from '@/lib/db/items'
import { getBreadcrumb, getLocationById } from '@/lib/db/locations'
import { requireHousehold } from '@/lib/db/session'
import { NouObjecteForm } from './nou-objecte-form'

export const metadata = { title: 'Afegir un objecte' }

export default async function NouObjectePage({ searchParams }: PageProps<'/objectes/nou'>) {
  const params = await searchParams
  const locationId = typeof params.ubicacio === 'string' ? params.ubicacio : null

  const { household } = await requireHousehold()
  const [categories, location] = await Promise.all([
    getCategories(),
    locationId === null ? Promise.resolve(null) : getLocationById(locationId),
  ])

  // Una ubicació que no existeix (o d'una altra casa, que la RLS amaga) fa
  // que la pàgina no tingui sentit: val més un 404 que un formulari que
  // desaria l'objecte en un lloc que no és.
  if (locationId !== null && location === null) notFound()

  const chain = location === null ? [] : await getBreadcrumb(location.id)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {chain.length > 0 ? <LocationBreadcrumb chain={chain} /> : null}
        <h1 className="text-xl font-semibold">
          {location === null ? 'Afegir un objecte' : `Guardar a ${location.name}`}
        </h1>
      </div>

      <NouObjecteForm
        householdId={household.id}
        locationId={location?.id ?? null}
        locationCode={location?.code ?? null}
        categories={categories}
      />
    </div>
  )
}
