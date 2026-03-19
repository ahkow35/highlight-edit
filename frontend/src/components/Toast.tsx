import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const styles =
    type === 'success'
      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]'
      : 'bg-[#FEF2F2] border-[#FECACA] text-[#EF4444]';

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-fade-in max-w-sm ${styles}`}
      role="alert"
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onDismiss}
        className="ml-auto hover:opacity-70 transition-opacity flex-shrink-0"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
