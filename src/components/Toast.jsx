import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const variants = {
  success: {
    icon: <CheckCircle2 size={18} />,
    wrapper: 'bg-emerald-500 text-white',
  },
  error: {
    icon: <AlertTriangle size={18} />,
    wrapper: 'bg-red-500 text-white',
  },
  info: {
    icon: <Info size={18} />,
    wrapper: 'bg-orange-500 text-white',
  },
};

export function Toast({ toast, onClose }) {
  if (!toast) return null;
  const { type = 'info', title, message } = toast;
  const tone = variants[type] || variants.info;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto max-w-md w-full bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-4 animate-bounce-in flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone.wrapper}`}>
          {tone.icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-900">{title}</div>
          {message && <div className="text-xs text-gray-500 mt-0.5">{message}</div>}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg active:scale-95"
          aria-label="关闭提示"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
