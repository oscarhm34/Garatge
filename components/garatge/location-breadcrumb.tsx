import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import type { LocationDetail } from '@/lib/types/database'

/**
 * Fil d'Ariadna d'una ubicació.
 *
 * Es fa amb enllaços reals a cada nivell perquè, en escanejar el QR d'una caixa,
 * es pugui pujar al prestatge o a la porta amb un toc sense tornar al mapa.
 */
export function LocationBreadcrumb({ chain }: { chain: LocationDetail[] }) {
  return (
    <nav aria-label="Ubicació" className="text-muted-foreground flex flex-wrap items-center text-sm">
      <Link href="/mapa" className="hover:text-foreground flex items-center gap-1">
        <Home className="size-3.5" aria-hidden />
        <span className="sr-only">Mapa del garatge</span>
      </Link>

      {chain.map((node, index) => {
        const isLast = index === chain.length - 1
        return (
          <span key={node.id} className="flex items-center">
            <ChevronRight className="mx-0.5 size-3.5 shrink-0" aria-hidden />
            {isLast ? (
              <span className="text-foreground font-medium" aria-current="page">
                {node.name}
              </span>
            ) : (
              <Link href={`/l/${node.code}`} className="hover:text-foreground">
                {node.name}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
