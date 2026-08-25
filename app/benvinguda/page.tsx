import { redirect } from 'next/navigation'
import { Portada } from '@/components/garatge/portada'
import { getSessionContext } from '@/lib/db/session'
import { BenvingudaForm } from './benvinguda-form'

export const metadata = { title: 'Benvingut' }

export default async function BenvingudaPage() {
  const ctx = await getSessionContext()
  if (!ctx) redirect('/login')
  // Ja té casa: aquesta pàgina no li serveix de res.
  if (ctx.household) redirect('/')

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-5 px-5 py-8">
      <Portada className="max-h-56 object-cover object-top" />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hola, {ctx.profile.display_name}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Encara no estàs en cap casa. Crea la del garatge o entra a la que ja ha creat algú de la
          família.
        </p>
      </div>

      <BenvingudaForm />
    </main>
  )
}
