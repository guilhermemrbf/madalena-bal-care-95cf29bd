import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, ScanLine } from 'lucide-react';

interface Props {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const scannerId = 'barcode-scanner-region';
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 280, height: 150 },
        aspectRatio: 1.5,
      },
      (decodedText) => {
        onScan(decodedText);
        scanner.stop().catch(() => {});
        onClose();
      },
      () => {}
    ).catch((err) => {
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      console.error('Scanner error:', err);
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(10,30,18,0.7)] backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-card rounded-2xl p-6 w-[420px] max-w-[95vw] shadow-2xl border border-border animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[hsl(148,40%,93%)] rounded-xl flex items-center justify-center text-primary">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg text-primary">Leitor de Código de Barras</h3>
              <p className="text-xs text-muted-foreground">Aponte a câmera para o código</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive-light transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error ? (
          <div className="bg-destructive-light text-destructive rounded-xl p-4 text-sm font-semibold text-center">
            {error}
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border-2 border-primary/20">
            <div id="barcode-scanner-region" ref={containerRef} className="w-full" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[280px] h-[2px] bg-destructive/60 animate-pulse" />
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-3 font-semibold">
          💡 Posicione o código de barras dentro da área destacada
        </p>
      </div>
    </div>
  );
}
