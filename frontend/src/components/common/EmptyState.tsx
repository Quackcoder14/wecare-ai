import { useTranslation } from '../../i18n/context';
import { Inbox, Plus, Search, Filter } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, message, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`card p-8 text-center ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pale-blue flex items-center justify-center text-teal">
        {icon || <Inbox className="w-8 h-8" aria-hidden="true" />}
      </div>
      <h3 className="text-lg font-semibold text-charcoal mb-2">{title}</h3>
      {message && <p className="text-secondary mb-6">{message}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

export function EmptyQueue({ onNewPatient }: { onNewPatient: () => void }) {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={<Inbox className="w-8 h-8" aria-hidden="true" />}
      title={t('dashboard.queue.emptyState')}
      message="Create a new patient assessment to get started"
      action={
        <button onClick={onNewPatient} className="btn btn-primary flex items-center gap-2 mx-auto">
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t('dashboard.newPatientAction').replace('+ ', '')}
        </button>
      }
    />
  );
}

export function EmptySearch({ onClearFilters }: { onClearFilters?: () => void }) {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={<Search className="w-8 h-8" aria-hidden="true" />}
      title="No results found"
      message="Try adjusting your search or filters"
      action={onClearFilters && (
        <button onClick={onClearFilters} className="btn btn-outline flex items-center gap-2 mx-auto">
          <Filter className="w-4 h-4" aria-hidden="true" />
          {t('common.clear')}
        </button>
      )}
    />
  );
}