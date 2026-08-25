/**
 * Tipus de l'API nativa BarcodeDetector.
 *
 * Encara no forma part de les definicions estàndard de TypeScript perquè no
 * està implementada a tots els navegadors: hi és a Chrome i a Android, però no
 * a Safari d'iOS, on cal el lector de @zxing/browser. Es declara aquí per
 * poder-la fer servir sense recórrer a `any`.
 */
interface DetectedBarcode {
  readonly rawValue: string
  readonly format: string
  readonly boundingBox: DOMRectReadOnly
  readonly cornerPoints: ReadonlyArray<{ x: number; y: number }>
}

interface BarcodeDetectorOptions {
  formats?: readonly string[]
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions)
  static getSupportedFormats(): Promise<string[]>
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector
}
