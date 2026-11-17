import { useEffect } from 'react';

// Reusable centered modal overlay with backdrop + escape-to-close.
export default function Modal({ open, onClose, title, icon, iconColor = 'text-emerald-600', children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className={`card w-full ${maxWidth} p-6 space-y-4 relative max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-content-faint hover:text-content transition-colors"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark text-lg" />
        </button>
        {title && (
          <div className="flex items-center gap-3">
            {icon && <i className={`${icon} text-xl ${iconColor}`} />}
            <h3 className="text-lg font-bold tracking-tight text-content">{title}</h3>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
