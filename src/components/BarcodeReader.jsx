import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';

// ZXing con solo formatos de producto (EAN/UPC/Code128) → mucho más rápido
const HINTS = new Map([
  [DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
  ]],
  [DecodeHintType.TRY_HARDER, true],
]);

export default function BarcodeReader({ onDetected, active = true }) {
  const videoRef    = useRef(null);
  const readerRef   = useRef(null);
  const controlsRef = useRef(null);
  const lastCode    = useRef(null);
  const [error, setError] = useState(null);

  const stopScanner = useCallback(() => {
    try { controlsRef.current?.stop(); } catch {}
    controlsRef.current = null;
  }, []);

  useEffect(() => {
    if (!active) { stopScanner(); return; }

    let mounted = true;

    const start = async () => {
      try {
        // Seleccionar cámara trasera por label si hay múltiples
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const back = devices.find(d =>
          /back|rear|environment/i.test(d.label)
        ) || devices[devices.length - 1];
        const deviceId = back?.deviceId || undefined;

        readerRef.current = new BrowserMultiFormatReader(HINTS, 150); // 150ms entre scans

        // Constraints: cámara trasera + alta resolución para leer bien el código
        const constraints = deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } };

        controlsRef.current = await readerRef.current.decodeFromConstraints(
          { video: constraints },
          videoRef.current,
          (result, err) => {
            if (!mounted) return;
            if (result) {
              const code = result.getText();
              if (code && code !== lastCode.current) {
                lastCode.current = code;
                // Vibrar si está disponible (Android)
                if (navigator.vibrate) navigator.vibrate(80);
                onDetected(code);
                // Reset debounce después de 2s para permitir re-scan
                setTimeout(() => { lastCode.current = null; }, 2000);
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              // Errores reales (no solo "no barcode found en este frame")
              if (err.name !== 'NotFoundException') console.warn('[scanner]', err.message);
            }
          }
        );
      } catch (e) {
        if (mounted) {
          if (e.name === 'NotAllowedError') setError('Camera permission denied. Please allow camera access.');
          else if (e.name === 'NotFoundError') setError('No camera found on this device.');
          else setError(e.message);
        }
      }
    };

    start();
    return () => { mounted = false; stopScanner(); };
  }, [active, onDetected, stopScanner]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-center px-6">
        <div>
          <div className="text-4xl mb-3">📷</div>
          <p className="text-white font-bold mb-1">Camera Error</p>
          <p className="text-white/60 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      playsInline
      muted
      autoPlay
    />
  );
}
