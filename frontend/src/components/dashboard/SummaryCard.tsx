import React from 'react';

interface SummaryCardProps {
  title?: string;
  value?: number;
  variant?: 'default' | 'red' | 'yellow' | 'green';
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function SummaryCard({
  title = 'Loading...',
  value = 0,
  variant = 'default',
  icon,
  loading = false,
  className = '',
}: SummaryCardProps) {
  const variantStyles = {
    default: 'border-l-4 border-teal',
    red: 'border-l-4 border-acuity-red',
    yellow: 'border-l-4 border-yellow-500',
    green: 'border-l-4 border-acuity-green',
  };

  if (loading) {
    return (
      <div className={`card p-5 ${variantStyles[variant]} animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-pale-blue rounded" aria-hidden="true" />
          <div className="h-10 w-10 bg-pale-blue rounded" aria-hidden="true" />
        </div>
        <div className="mt-4 h-8 w-16 bg-pale-blue rounded" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={`card p-5 ${variantStyles[variant]} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary">{title}</p>
          <p className="mt-1 text-2xl font-bold text-charcoal">{value}</p>
        </div>
        {icon && (
          <div className={`w-10 h-10 flex items-center justify-center rounded-lg shrink-0 ${
            variant === 'red' ? 'bg-acuity-red/10 text-acuity-red' :
            variant === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
            variant === 'green' ? 'bg-acuity-green/10 text-acuity-green' :
            'bg-pale-blue text-teal'
          }`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}