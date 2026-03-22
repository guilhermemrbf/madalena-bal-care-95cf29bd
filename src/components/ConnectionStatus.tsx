import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getQueueLength } from '@/store/syncQueue';
import { useState, useEffect } from 'react';

export default function ConnectionStatus() {
  const { isOnline, showReconnected } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const check = () => setPendingCount(getQueueLength());
    check();
    const id = setInterval(check, 2000);
    return () => clearInterval(id);
  }, []);

  // Auto "sync" when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      setSyncing(true);
      // Simulate sync delay — in a real app this would call processQueue
      const timer = setTimeout(() => {
        setSyncing(false);
        setPendingCount(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount]);

  // Offline banner
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-[260px] right-0 z-[50] bg-[#5a4000] text-white px-4 py-2.5 flex items-center justify-center gap-2.5 text-sm font-bold shadow-lg animate-fade-in">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>Sem conexão à internet — trabalhando offline</span>
        <CloudOff className="w-4 h-4 opacity-60" />
        {pendingCount > 0 && (
          <span className="ml-2 bg-white/20 rounded-full px-2.5 py-0.5 text-xs">
            {pendingCount} operação(ões) pendente(s)
          </span>
        )}
      </div>
    );
  }

  // Syncing indicator
  if (syncing) {
    return (
      <div className="fixed top-0 left-[260px] right-0 z-[50] bg-info text-white px-4 py-2.5 flex items-center justify-center gap-2.5 text-sm font-bold shadow-lg animate-fade-in">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Sincronizando dados pendentes...</span>
      </div>
    );
  }

  // Reconnected flash
  if (showReconnected) {
    return (
      <div className="fixed top-0 left-[260px] right-0 z-[50] bg-primary text-white px-4 py-2.5 flex items-center justify-center gap-2.5 text-sm font-bold shadow-lg animate-fade-in">
        <CheckCircle2 className="w-4 h-4" />
        <span>Conexão restaurada — dados sincronizados ✓</span>
      </div>
    );
  }

  return null;
}

// Small inline badge for the topbar
export function ConnectionBadge() {
  const { isOnline } = useOnlineStatus();
  const pending = getQueueLength();

  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border transition-colors ${
      isOnline
        ? 'bg-[hsl(148,40%,93%)] text-primary border-border'
        : 'bg-[#fff8e6] text-[#8a6400] border-[#f0c040]'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="w-3 h-3" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
          {pending > 0 && (
            <span className="bg-[#f0c040] text-[#5a4000] rounded-full px-1.5 text-[10px]">{pending}</span>
          )}
        </>
      )}
    </div>
  );
}
