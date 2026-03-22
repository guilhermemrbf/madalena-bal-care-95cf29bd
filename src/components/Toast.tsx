import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Check, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastCtx {
  showToast: (msg: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx>({ showToast: () => {} });
export const useToastCustom = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const Icon = toast?.type === 'success' ? Check : toast?.type === 'error' ? X : Info;
  const bg = toast?.type === 'success' ? 'bg-primary' : toast?.type === 'error' ? 'bg-destructive' : 'bg-foreground';

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg max-w-xs animate-fade-in ${bg}`}>
          <Icon className="w-[18px] h-[18px] shrink-0" />
          {toast.msg}
        </div>
      )}
    </Ctx.Provider>
  );
}
