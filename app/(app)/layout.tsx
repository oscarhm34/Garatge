import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Settings, Warehouse } from 'lucide-react'
import { BottomNav } from '@/components/garatge/bottom-nav'
import { Button } from '@/components/ui/button'
import { getSessionContext } from '@/lib/db/session'

/**
 * Closca de tota la part interna de l'app.
 *
 * La comprovació de casa es fa aquí i no a proxy.ts a posta: el proxy corre a
 * cada petició d'imatge i de navegació, i afegir-hi una consulta a la base de
 * dades encariria tota l'app per una cosa que només cal saber un cop per pàgina.
 */
export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const ctx = await getSessionContext()
  if (!ctx) redirect('/login')
  if (!ctx.household) redirect('/benvinguda')

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Warehouse className="text-primary size-5" aria-hidden />
            <span>{ctx.household.name}</span>
          </Link>
          <Button asChild variant="ghost" size="icon" aria-label="Ajustos">
            <Link href="/ajustos">
              <Settings className="size-5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">{children}</main>

      <BottomNav />
    </div>
  )
}
