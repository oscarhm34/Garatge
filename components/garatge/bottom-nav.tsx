'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, Grid2x2, ScanLine, Search, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Cercar', icon: Search },
  { href: '/mapa', label: 'Mapa', icon: Grid2x2 },
  { href: '/escanejar', label: 'Escanejar', icon: ScanLine },
  { href: '/etiquetes', label: 'Etiquetes', icon: Tag },
  { href: '/historial', label: 'Historial', icon: Clock },
] as const

/**
 * Barra inferior. Va a baix i no a dalt perquè al garatge l'app es fa servir
 * dret, amb una mà, i el polze no arriba a la part superior d'un mòbil gran.
 */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegació principal"
      className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-40 border-t backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-2xl items-stretch">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
