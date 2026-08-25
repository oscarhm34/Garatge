'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BotoImprimir() {
  return (
    <Button onClick={() => window.print()}>
      <Printer />
      Imprimir el full
    </Button>
  )
}
