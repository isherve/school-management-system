import { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores';

export function ToastHost() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: { id: string; message: string; type: 'success' | 'error' | 'info' };
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg',
        toast.type === 'success' && 'border-emerald-200 dark:border-emerald-900',
        toast.type === 'error' && 'border-red-200 dark:border-red-900',
        toast.type === 'info' && 'border-border'
      )}
      role="status"
    >
      <Icon className={cn(
        'h-5 w-5 shrink-0 mt-0.5',
        toast.type === 'success' && 'text-emerald-600',
        toast.type === 'error' && 'text-red-600',
        toast.type === 'info' && 'text-primary'
      )} />
      <p className="text-sm flex-1 text-left">{toast.message}</p>
      <button type="button" onClick={onDismiss} className="text-muted-foreground hover:text-foreground p-0.5" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
