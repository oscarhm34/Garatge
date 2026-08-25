import Link from 'next/link'
import { HandCoins, MapPin, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ItemDetail } from '@/lib/types/database'

interface ItemCardProps {
  item: ItemDetail
  /** URL signada de la foto, si n'hi ha. Ve resolta des del servidor. */
  photoUrl?: string
}

/**
 * Fila d'un objecte a una llista.
 *
 * El camí complet ("Armari 2 · Porta 1 · Prestatge 3") és la informació més
 * important de la targeta, no el nom: qui busca ja sap què busca, el que no sap
 * és on és. Per això va en un color destacat i no com a lletra petita grisa.
 */
export function ItemCard({ item, photoUrl }: ItemCardProps) {
  const borrowed = item.open_loan_id !== null

  return (
    <Link
      href={`/objectes/${item.id}`}
      className="hover:bg-accent focus-visible:ring-ring flex items-center gap-3 rounded-xl border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL signada de durada curta: next/image la tornaria a signar en cada revalidació
          <img src={photoUrl} alt="" className="size-full object-cover" loading="lazy" />
        ) : (
          <Package className="text-muted-foreground size-6" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{item.name}</span>
          {item.quantity > 1 ? (
            <span className="text-muted-foreground shrink-0 text-xs">×{item.quantity}</span>
          ) : null}
        </div>

        <div className="text-primary mt-0.5 flex items-center gap-1 text-sm">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{item.location_path ?? 'Sense lloc assignat'}</span>
        </div>

        {borrowed ? (
          <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
            <HandCoins className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              El té {item.borrowed_by_name ?? 'algú'}
              {item.borrowed_at ? ` des del ${formatDate(item.borrowed_at)}` : ''}
            </span>
          </div>
        ) : null}
      </div>

      {item.category_name ? (
        <Badge variant="secondary" className="shrink-0 max-sm:hidden">
          {item.category_name}
        </Badge>
      ) : null}
    </Link>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })
}
