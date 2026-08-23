import React from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useHireFlow } from '../../context/HireFlowContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useHireFlow();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        const isSuccess = t.type === 'success' || !t.type;
        const isWarning = t.type === 'warning';
        const isError = t.type === 'error';

        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 rounded-xl shadow-xl backdrop-blur-md border border-slate-800 dark:border-slate-100 text-xs sm:text-sm font-medium animate-in slide-in-from-bottom-5 fade-in duration-200"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />}
              {isWarning && <AlertCircle className="w-4 h-4 text-amber-400 dark:text-amber-600 shrink-0" />}
              {isError && <XCircle className="w-4 h-4 text-rose-400 dark:text-rose-600 shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-sky-400 dark:text-sky-600 shrink-0" />}
              <span className="truncate">{t.message}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {t.actionLabel && t.onAction && (
                <button
                  onClick={() => {
                    t.onAction?.();
                    dismissToast(t.id);
                  }}
                  className="font-bold underline text-emerald-300 dark:text-emerald-700 hover:text-white dark:hover:text-black cursor-pointer text-xs"
                >
                  {t.actionLabel}
                </button>
              )}
              <button
                onClick={() => dismissToast(t.id)}
                className="text-slate-400 hover:text-white dark:hover:text-black cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
