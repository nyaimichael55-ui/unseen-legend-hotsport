import React from 'react';
import { Check, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-[#111827] border border-white/[0.1] shadow-2xl shadow-black/60 backdrop-blur-md text-xs text-slate-200 transition-all duration-150 ease-in-out animate-in slide-in-from-bottom-2 fade-in"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.type === 'warning' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <span className="truncate font-medium text-slate-200 text-xs tracking-tight">{toast.message}</span>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
