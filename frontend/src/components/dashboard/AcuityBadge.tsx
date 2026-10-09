import { useTranslation } from '../../i18n/context';

interface AcuityBadgeProps {
  category: 'red' | 'yellow' | 'green' | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function AcuityBadge({
  category,
  size = 'md',
  showLabel = true,
  className = '',
}: AcuityBadgeProps) {
  const { t } = useTranslation();

  const normalized = category.toLowerCase();
  const isValid = ['red', 'yellow', 'green'].includes(normalized);
  const cat = isValid ? normalized as 'red' | 'yellow' | 'green' : 'unknown';

  const styles = {
    red: { bg: 'bg-acuity-red/10', text: 'text-acuity-red', border: 'border-acuity-red/20' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    green: { bg: 'bg-acuity-green/10', text: 'text-acuity-green', border: 'border-acuity-green/20' },
    unknown: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  };

  const labels = {
    red: t('assessment.acuityLabels.red'),
    yellow: t('assessment.acuityLabels.yellow'),
    green: t('assessment.acuityLabels.green'),
    unknown: t('assessment.acuityLabels.unknown'),
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const style = styles[cat];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${style.bg} ${style.text} ${style.border} ${sizeStyles[size]} ${className}`}
      aria-label={showLabel ? labels[cat] : undefined}
    >
      <span className={`w-2 h-2 rounded-full ${style.text.replace('text-', 'bg-')}`} aria-hidden="true" />
      {showLabel && <span>{labels[cat]}</span>}
    </span>
  );
}

export function ReviewStatusBadge({
  status,
  size = 'md',
  className = '',
}: {
  status: 'pending' | 'acknowledged' | 'not_required';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { t } = useTranslation();

  const styles = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', label: t('assessment.reviewLabels.required') },
    acknowledged: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', label: t('assessment.reviewLabels.acknowledged') },
    not_required: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: t('assessment.reviewLabels.notRequired') },
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const style = styles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${style.bg} ${style.text} ${style.border} ${sizeStyles[size]} ${className}`}
      aria-label={style.label}
    >
      {status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" aria-hidden="true" />}
      {status === 'acknowledged' && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" aria-hidden="true" />}
      <span>{style.label}</span>
    </span>
  );
}