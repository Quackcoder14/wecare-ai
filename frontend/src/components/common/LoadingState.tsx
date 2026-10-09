import { useTranslation } from '../../i18n/context';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function LoadingState({ message, size = 'md', fullScreen = false }: LoadingStateProps) {
  const { t } = useTranslation();

  const spinnerSize = {
    sm: 'w-4 h-4 border-1.5',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  }[size];

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-background/90'
    : 'flex flex-col items-center justify-center';

  return (
    <div className={containerClass} role="status" aria-live="polite" aria-label={message || t('common.loading')}>
      <div className={`${spinnerSize} rounded-full border-border border-t-teal animate-spin`} aria-hidden="true" />
      {message && (
        <p className="mt-3 text-sm text-secondary text-center">{message}</p>
      )}
      {!message && fullScreen && (
        <p className="mt-3 text-sm text-secondary text-center">{t('common.loading')}</p>
      )}
    </div>
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return <LoadingState message={message} fullScreen />;
}

export function LoadingInline({ message }: { message?: string }) {
  return <LoadingState message={message} size="sm" />;
}