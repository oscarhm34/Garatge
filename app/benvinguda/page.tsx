import { redirect } from 'next/navigation'
import { Warehouse } from 'lucide-react'
import { getSessionContext } from '@/lib/db/session'
import { BenvingudaForm } from './benvinguda-form'

export const metadata = { title: 'Benvingut' }

export default async function BenvingudaPage() {
  const ctx = await getSessionContext()
  if (!ctx) redirect('/login')
  // Ja té casa: aquesta pàgina no li serveix de res.
  if (ctx.household) redirect('/')

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-2xl">
          <Warehouse className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hola, {ctx.profile.display_name}
          </h1>
          <p className="text-muted-foreground max-w-sm text-sm">
            Encara no estàs en cap casa. Crea la del garatge o entra a la que ja ha creat algú de
            la família.
          </p>
        </div>
      </div>

      <BenvingudaForm />
    </main>
  )
}
