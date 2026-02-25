import { useState, useCallback } from 'react';

interface ToastItem {
  id: number;
  msg: string;
  type: 'error' | 'warn' | 'info';
}

let _toastId = 0;
let _addToast: ((msg: string, type?: ToastItem['type']) => void) | null = null;

export function showToast(msg: string, type: ToastItem['type'] = 'error') {
  _addToast?.(msg, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  _addToast = useCallback((msg: string, type: ToastItem['type'] = 'error') => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast ${
            t.type === 'error'
              ? 'bg-red-900/90 text-red-200 border border-red-700'
              : 'bg-yellow-900/90 text-yellow-200 border border-yellow-700'
          }`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
