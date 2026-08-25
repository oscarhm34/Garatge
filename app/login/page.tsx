import { Suspense } from 'react'
import { Warehouse } from 'lucide-react'
import { LoginForm } from './login-form'

export const metadata = { title: 'Entrar' }

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams
  const raw = params.next
  const next = typeof raw === 'string' ? raw : '/'

  // Només rutes internes. Sense aquesta comprovació, un enllaç
  // /login?next=https://... convertiria la pàgina d'entrada en un redirector obert.
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-2xl">
          <Warehouse className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Garatge</h1>
          <p className="text-muted-foreground text-sm">On és cada cosa de casa</p>
        </div>
      </div>

      <Suspense>
        <LoginForm next={safeNext} />
      </Suspense>
    </main>
  )
}
