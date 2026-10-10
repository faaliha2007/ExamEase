import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const confirmBtnStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <AlertTriangle className={`w-5 h-5 ${confirmVariant === 'danger' ? 'text-rose-500' : 'text-blue-500'}`} />
            <span>{title}</span>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 text-slate-600 text-sm leading-relaxed">
          {message}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-offset-1 disabled:opacity-50 ${
              confirmBtnStyles[confirmVariant] || confirmBtnStyles.primary
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
