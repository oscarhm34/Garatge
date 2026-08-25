import { EscanejarClient } from './escanejar-client'

export const metadata = { title: 'Escanejar' }

export default function EscanejarPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Escanejar</h1>
        <p className="text-muted-foreground text-sm">
          Apunta a l&apos;adhesiu d&apos;una porta, un prestatge o una caixa.
        </p>
      </div>

      <EscanejarClient />
    </div>
  )
}
