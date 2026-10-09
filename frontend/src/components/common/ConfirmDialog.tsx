import { useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/context';
import { X } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useMediaQuery';
import { animate } from 'animejs';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'secondary';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      dialogRef.current?.focus();

      if (!reducedMotion && dialogRef.current) {
        animate(dialogRef.current, {
          scale: [0.95, 1],
          opacity: [0, 1],
          duration: 150,
          easing: 'easeOutQuad',
        });
      }
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, reducedMotion]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'Tab') {
        // Trap focus within dialog
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const confirmVariant = {
    danger: 'btn-danger',
    primary: 'btn-primary',
    secondary: 'btn-secondary',
  }[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      <div
        ref={dialogRef}
        id="confirm-dialog"
        className="card w-full max-w-md animate-fade-in"
        tabIndex={-1}
      >
        <div className="p-5">
          <div className="flex items-start justify-between">
            <h2 id="dialog-title" className="text-lg font-semibold text-charcoal">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="btn btn-ghost p-1 text-secondary hover:text-charcoal"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <p id="dialog-message" className="mt-3 text-secondary">
            {message}
          </p>
        </div>
        <div className="px-5 pb-5 pt-0 flex items-center justify-end gap-3 border-t border-border">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary"
          >
            {cancelLabel || t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`btn ${confirmVariant} flex items-center gap-2`}
          >
            {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />}
            {confirmLabel || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}