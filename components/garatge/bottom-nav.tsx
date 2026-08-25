'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Grid2x2, ScanLine, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Barra inferior.
 *
 * Tres coses i prou: buscar, escanejar i mirar el mapa. Etiquetes i historial
 * van a Ajustos, perque les etiquetes s'imprimeixen quatre cops en tota la
 * vida i el registre d'activitat no l'obre ningu de casa. Una barra amb cinc
 * pestanyes obliga a llegir-les; amb tres, s'hi va sense pensar.
 *
 * Va a baix perque al garatge s'hi es dret i amb una ma: el polze no arriba a
 * la part alta d'un mobil gran.
 */
export function BottomNav() {
  const pathname = usePathname()
  const escanejant = pathname.startsWith('/escanejar')

  return (
    <nav
      aria-label="Navegació principal"
      className="bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky bottom-0 z-40 border-t backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-2xl items-stretch">
        <Pestanya href="/" label="Cercar" icon={Search} pathname={pathname} />

        {/* Escanejar es l'unic boto de color: es l'accio que es fa mes vegades
            i sempre amb pressa, plantat davant d'un armari obert. Tenir-lo
            sempre al mateix lloc vol dir poder-lo prémer sense mirar. */}
        <li className="flex flex-1 justify-center">
          <Link
            href="/escanejar"
            aria-label="Escanejar un QR"
            aria-current={escanejant ? 'page' : undefined}
            className={cn(
              'my-1.5 flex size-14 items-center justify-center rounded-full transition-transform active:scale-95',
              escanejant
                ? 'bg-foreground text-background'
                : 'bg-primary text-primary-foreground shadow-md',
            )}
          >
            <ScanLine className="size-7" aria-hidden />
          </Link>
        </li>

        <Pestanya href="/mapa" label="Mapa" icon={Grid2x2} pathname={pathname} />
      </ul>
    </nav>
  )
}

interface PestanyaProps {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  pathname: string
}

function Pestanya({ href, label, icon: Icon, pathname }: PestanyaProps) {
  const actiu = href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <li className="flex-1">
      <Link
        href={href}
        aria-current={actiu ? 'page' : undefined}
        className={cn(
          // min-h-[var(--toc)] son els 56 px que demana un dit amb guant.
          'flex min-h-[var(--toc)] flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
          actiu ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <Icon className="size-5" aria-hidden />
        {label}
      </Link>
    </li>
  )
}
