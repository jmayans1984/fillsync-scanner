import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat, NotFoundException } from '@zxing/library';

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
    try {
      controlsRef.current?.stop();
      // Liberar todas las pistas de vídeo explícitamente
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch {}
    controlsRef.current = null;
    readerRef.current = null;
  }, []);

  useEffect(() => {
    if (!active) { stopScanner(); return; }

    let mounted = true;

    const start = async () => {
      try {
        readerRef.current = new BrowserMultiFormatReader(HINTS, 150);

        // Cámara trasera con facingMode exact como prioridad
        const constraints = { facingMode: { exact: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } };

        controlsRef.current = await readerRef.current.decodeFromConstraints(
          { video: constraints },
          videoRef.current,
          (result, err) => {
            if (!mounted) return;
            if (result) {
              const code = result.getText();
              if (code && code !== lastCode.current) {
                lastCode.current = code;
                if (navigator.vibrate) navigator.vibrate(80);
                onDetected(code);
                setTimeout(() => { lastCode.current = null; }, 2000);
              }
            }
            if (err && !(err instanceof NotFoundException)) {
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
