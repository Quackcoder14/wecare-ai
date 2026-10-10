interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className = '' }: PageHeaderProps) {

  return (
    <header className={`mb-6 animate-fade-in ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-secondary">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0 mt-2 sm:mt-0">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}