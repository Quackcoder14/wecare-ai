import { useTranslation } from '../../i18n/context';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({ message, onRetry, retryLabel, className = '' }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className={`card p-6 text-center ${className}`} role="alert">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-acuity-red/10 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-acuity-red" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-charcoal mb-2">
        {t('common.error')}
      </h3>
      <p className="text-secondary mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-outline flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          {retryLabel || t('common.retry')}
        </button>
      )}
    </div>
  );
}

export function InlineError({ message, className = '' }: { message: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg bg-acuity-red/10 border border-acuity-red/20 text-acuity-red text-sm ${className}`} role="alert">
      <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}