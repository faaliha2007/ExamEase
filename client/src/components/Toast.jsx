import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      role="status"
      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-sm text-sm ${config.bg} animate-in fade-in duration-200`}
    >
      <div className="flex items-center gap-2.5">
        {config.icon}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
