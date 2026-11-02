import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

// Toast colors and icons
const toastStyles: Record<
  ToastType,
  { bg: string; border: string; text: string; Icon: LucideIcon }
> = {
  success: { bg: 'bg-[rgb(var(--app-raised))]', border: 'border-[rgb(var(--app-border))]', text: 'text-[rgb(var(--ink))]', Icon: Check },
  error: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-800', Icon: X },
  warning: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-800', Icon: AlertTriangle },
  info: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-800', Icon: Info },
};

// Toast Component
const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const style = toastStyles[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 ${style.bg} ${style.border} ${style.text} animate-slide-in min-w-[300px] max-w-[450px]`}
      role="alert"
    >
      <style.Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <p className="text-sm font-medium flex-grow">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className={`flex-shrink-0 ${style.text} opacity-60 hover:opacity-100 transition-opacity text-lg leading-none`}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

// Provider component
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, duration: number = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, type, message, duration };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Container — fixed bottom-right */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

// Hook
export const useToast = () => useContext(ToastContext);
