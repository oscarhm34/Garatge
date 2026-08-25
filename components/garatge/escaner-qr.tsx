'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CameraOff, Loader2 } from 'lucide-react'
import { extractLocationCode } from '@/lib/qr-parse'

interface Props {
  /** Es crida un sol cop per lectura vàlida. */
  onCode: (code: string) => void
  /** Text d'ajuda sota el visor. */
  hint?: string
}

type Estat = 'iniciant' | 'escanejant' | 'error'

/**
 * Visor de QR.
 *
 * Fa servir BarcodeDetector quan el navegador el porta de sèrie (Chrome i
 * Android): és més ràpid i gasta menys bateria perquè la descodificació la fa
 * el sistema. A iOS Safari, que encara no el té, cau a @zxing/browser, que
 * descodifica en JavaScript. La descàrrega de zxing és dinàmica per no fer
 * pagar 200 kB a qui no els necessita.
 */
export function EscanerQr({ onCode, hint }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [estat, setEstat] = useState<Estat>('iniciant')
  const [error, setError] = useState<string | null>(null)

  // Guarda contra lectures repetides: la càmera enfoca el mateix QR trenta
  // vegades per segon i sense això es dispararien trenta navegacions.
  const consumed = useRef(false)

  const handle = useCallback(
    (text: string) => {
      if (consumed.current) return
      const code = extractLocationCode(text)
      if (!code) return
      consumed.current = true
      onCode(code)
    },
    [onCode],
  )

  useEffect(() => {
    let stream: MediaStream | null = null
    let raf = 0
    let stopZxing: (() => void) | null = null
    let cancelled = false

    async function start() {
      const video = videoRef.current
      if (!video) return

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          // facingMode 'environment' demana la càmera del darrere; sense això
          // al mòbil s'obre la frontal i s'ha d'escanejar amb un mirall.
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
      } catch (caught) {
        if (cancelled) return
        setEstat('error')
        setError(
          caught instanceof DOMException && caught.name === 'NotAllowedError'
            ? 'Cal donar permís per fer servir la càmera.'
            : 'No s’ha pogut obrir la càmera d’aquest dispositiu.',
        )
        return
      }

      if (cancelled) {
        for (const track of stream.getTracks()) track.stop()
        return
      }

      video.srcObject = stream
      video.setAttribute('playsinline', 'true')
      await video.play().catch(() => undefined)
      setEstat('escanejant')

      const Detector = window.BarcodeDetector
      if (Detector) {
        const detector = new Detector({ formats: ['qr_code'] })
        const tick = async () => {
          if (cancelled || consumed.current) return
          try {
            const found = await detector.detect(video)
            for (const barcode of found) handle(barcode.rawValue)
          } catch {
            // Un fotograma que no es pot analitzar no és cap error: el següent sí.
          }
          raf = requestAnimationFrame(() => void tick())
        }
        raf = requestAnimationFrame(() => void tick())
        return
      }

      const { BrowserQRCodeReader } = await import('@zxing/browser')
      if (cancelled) return
      const reader = new BrowserQRCodeReader()
      const controls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
        if (result) handle(result.getText())
      })
      stopZxing = () => controls.stop()
    }

    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stopZxing?.()
      // Sense això el llum de la càmera es queda encès en sortir de la pàgina.
      if (stream) for (const track of stream.getTracks()) track.stop()
    }
  }, [handle])

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-2xl">
        <video
          ref={videoRef}
          muted
          playsInline
          className="size-full object-cover"
          aria-label="Vista de la càmera"
        />

        {estat === 'escanejant' ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[18%] rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
          />
        ) : null}

        {estat === 'iniciant' ? (
          <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-6 animate-spin" aria-hidden />
            <span className="text-sm">Obrint la càmera…</span>
          </div>
        ) : null}

        {estat === 'error' ? (
          <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <CameraOff className="size-8" aria-hidden />
            <span className="text-sm">{error}</span>
          </div>
        ) : null}
      </div>

      {hint && estat === 'escanejant' ? (
        <p className="text-muted-foreground text-center text-sm">{hint}</p>
      ) : null}
    </div>
  )
}
