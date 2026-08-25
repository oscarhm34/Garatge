import Link from 'next/link'
import { Clock, LogOut, QrCode, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/server'
import { countItems } from '@/lib/db/items'
import { requireHousehold } from '@/lib/db/session'

export const metadata = { title: 'Ajustos' }

export default async function AjustosPage() {
  const { household, profile } = await requireHousehold()
  const supabase = await createClient()

  const [{ data: membres }, { count: ubicacions }, objectes] = await Promise.all([
    supabase.from('profiles').select('id, display_name, role').order('display_name'),
    supabase.from('locations').select('id', { count: 'exact', head: true }),
    countItems(),
  ])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">{household.name}</h1>
        <p className="text-muted-foreground text-sm">
          {objectes} {objectes === 1 ? 'objecte' : 'objectes'} en {ubicacions ?? 0} ubicacions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" aria-hidden />
            La família
          </CardTitle>
          <CardDescription>
            Qui vulgui entrar només ha de crear un compte i escriure aquest codi.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-xs">Codi d&apos;invitació</p>
            <p className="font-mono text-2xl font-bold tracking-[0.2em]">{household.invite_code}</p>
          </div>

          <ul className="flex flex-col gap-2">
            {(membres ?? []).map((membre) => (
              <li key={membre.id} className="flex items-center justify-between text-sm">
                <span>
                  {membre.display_name}
                  {membre.id === profile.id ? (
                    <span className="text-muted-foreground"> (tu)</span>
                  ) : null}
                </span>
                <span className="text-muted-foreground text-xs">
                  {membre.role === 'admin' ? 'administrador' : 'membre'}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Button asChild variant="outline" size="lg" className="h-14 justify-start">
          <Link href="/etiquetes">
            <QrCode />
            Imprimir les etiquetes
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-14 justify-start">
          <Link href="/historial">
            <Clock />
            Historial
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Formulari i no enllaç: tancar sessió és una acció, i per GET qualsevol
          imatge incrustada en una pàgina podria desconnectar l'usuari. */}
      <form action="/auth/signout" method="post">
        <Button type="submit" variant="ghost" className="text-muted-foreground w-full">
          <LogOut />
          Tancar la sessió
        </Button>
      </form>
    </div>
  )
}
