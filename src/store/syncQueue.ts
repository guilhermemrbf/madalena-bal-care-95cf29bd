// Offline sync queue for pending operations
// When the app has a backend in the future, this queue ensures
// operations performed offline are synced when connection returns.

export type OperationType = 'create_product' | 'update_product' | 'delete_product' | 'create_sale';

export interface PendingOperation {
  id: string;
  type: OperationType;
  timestamp: string;
  data: Record<string, unknown>;
  retries: number;
}

const QUEUE_KEY = 'mb_sync_queue';

function loadQueue(): PendingOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: PendingOperation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function addToQueue(type: OperationType, data: Record<string, unknown>) {
  const queue = loadQueue();
  const op: PendingOperation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    timestamp: new Date().toISOString(),
    data,
    retries: 0,
  };
  queue.push(op);
  saveQueue(queue);
  return op;
}

export function getQueue(): PendingOperation[] {
  return loadQueue();
}

export function removeFromQueue(id: string) {
  const queue = loadQueue().filter(op => op.id !== id);
  saveQueue(queue);
}

export function clearQueue() {
  saveQueue([]);
}

export function getQueueLength(): number {
  return loadQueue().length;
}

// Simulate sync — in a real app this would POST to an API
export async function processQueue(
  onProcess: (op: PendingOperation) => Promise<boolean>
): Promise<{ success: number; failed: number }> {
  const queue = loadQueue();
  let success = 0;
  let failed = 0;

  for (const op of queue) {
    try {
      const ok = await onProcess(op);
      if (ok) {
        removeFromQueue(op.id);
        success++;
      } else {
        // Increment retry count
        op.retries++;
        failed++;
      }
    } catch {
      op.retries++;
      failed++;
    }
  }

  // Update retries for failed items
  if (failed > 0) {
    const remaining = loadQueue();
    saveQueue(remaining);
  }

  return { success, failed };
}
