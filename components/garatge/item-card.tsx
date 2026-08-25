import Link from 'next/link'
import { Hand, Package } from 'lucide-react'
import { Placa, PlacaSenseLloc } from '@/components/garatge/placa'
import type { ItemDetail } from '@/lib/types/database'

interface ItemCardProps {
  item: ItemDetail
  /** URL signada de la foto, si n'hi ha. Ve resolta des del servidor. */
  photoUrl?: string
}

/**
 * Un objecte a una llista de resultats.
 *
 * El nom va a dalt perque, amb diversos resultats, es el que et fa triar quin
 * es el teu; pero el pes visual se l'endu la placa, perque un cop triat, el que
 * has de retenir per anar al garatge es el codi i el color.
 *
 * Tota la fila es zona de toc i respon amb un canvi d'escala: al garatge sovint
 * no mires la pantalla mentre la premes, i has de notar que ha registrat.
 */
export function ItemCard({ item, photoUrl }: ItemCardProps) {
  const prestat = item.open_loan_id !== null

  return (
    <Link
      href={`/objectes/${item.id}`}
      className="bg-card hover:border-foreground/30 focus-visible:ring-ring block rounded-lg border p-3 transition-transform active:scale-[0.985] focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex items-start gap-3">
        <div className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL signada de durada curta: next/image la tornaria a signar a cada revalidacio
            <img src={photoUrl} alt="" className="size-full object-cover" loading="lazy" />
          ) : (
            <Package className="text-muted-foreground size-5" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate font-semibold">{item.name}</span>
            {item.quantity > 1 ? (
              <span className="text-muted-foreground codi shrink-0 text-xs">
                ×{item.quantity}
              </span>
            ) : null}
          </div>

          {prestat ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">
              <Hand className="size-4 shrink-0" aria-hidden />
              <span className="truncate">
                El té {item.borrowed_by_name ?? 'algú'}
                {item.borrowed_at ? ` des del ${formatDate(item.borrowed_at)}` : ''}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      {item.location_code ? (
        <Placa codi={item.location_code} cami={item.location_path} encastada className="mt-2" />
      ) : (
        <PlacaSenseLloc className="mt-2" />
      )}
    </Link>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })
}
