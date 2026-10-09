import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { getServices } from '../../services';
import type { QueueItem } from '../../types/api';
import type { QueueFilter } from '../../services/queueService';
import { formatTimeAgo, getAcuityDisplay, getReviewStatusDisplay } from '../../services/assessmentService';
import { PageHeader } from '../common/PageHeader';
import { SummaryCard } from './SummaryCard';
import { PatientQueue } from './PatientQueue';
import { LoadingState, ErrorState } from '../common';

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const services = getServices();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadQueue = useCallback(async () => {
    try {
      setError(null);
      const response = await services.queue.getQueue(t);
      setQueue(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [services.queue, t]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await services.queue.refreshQueue(t);
      setQueue(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setRefreshing(false);
    }
  }, [services.queue, t]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const filteredQueue = queue.filter(item => {
    switch (filter) {
      case 'red':
        return item.acuity === 'red';
      case 'yellow':
        return item.acuity === 'yellow';
      case 'green':
        return item.acuity === 'green';
      case 'needs_review':
        return item.review_status === 'pending';
      default:
        return true;
    }
  });

  const summary = {
    total: queue.length,
    red: queue.filter(i => i.acuity === 'red').length,
    yellow: queue.filter(i => i.acuity === 'yellow').length,
    green: queue.filter(i => i.acuity === 'green').length,
    needsReview: queue.filter(i => i.review_status === 'pending').length,
  };

  const handleRowClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryCard loading />
          <SummaryCard loading />
          <SummaryCard loading />
        </div>
        <LoadingState message={t('dashboard.queue.loadingState')} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title={t('dashboard.title')}
          subtitle={t('dashboard.subtitle')}
          action={
            <button onClick={handleRefresh} className="btn btn-outline flex items-center gap-2" disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              {t('dashboard.refresh')}
            </button>
          }
        />
        <ErrorState message={error} onRetry={handleRefresh} retryLabel={t('dashboard.queue.retry')} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        action={
          <button
            onClick={() => navigate('/new-patient')}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {t('dashboard.newPatientAction').replace('+ ', '')}
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          title={t('dashboard.summaryCards.waiting')}
          value={summary.total}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <SummaryCard
          title={t('dashboard.summaryCards.highAcuity')}
          value={summary.red}
          variant="red"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <SummaryCard
          title={t('dashboard.summaryCards.needsReview')}
          value={summary.needsReview}
          variant="yellow"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        />
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="queue-filter" className="text-sm font-medium text-charcoal">
            {t('dashboard.filters.all')}:{' '}
            <select
              id="queue-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as QueueFilter)}
              className="input w-auto flex-1 min-w-[150px] max-w-[200px] py-1.5 text-sm"
              aria-label={t('dashboard.filters.all')}
            >
              <option value="all">{t('dashboard.filters.all')}</option>
              <option value="red">{t('dashboard.filters.red')}</option>
              <option value="yellow">{t('dashboard.filters.yellow')}</option>
              <option value="green">{t('dashboard.filters.green')}</option>
              <option value="needs_review">{t('dashboard.filters.needsReview')}</option>
            </select>
          </label>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-outline flex items-center gap-2 ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {t('dashboard.refresh')}
          </button>
        </div>
      </div>

      {/* Queue */}
      <PatientQueue
        items={filteredQueue}
        onRowClick={handleRowClick}
        formatTimeAgo={(ts) => formatTimeAgo(ts, t)}
        getAcuityDisplay={(cat) => getAcuityDisplay(cat, t)}
        getReviewStatusDisplay={(status) => getReviewStatusDisplay(status as 'pending' | 'acknowledged' | 'not_required', t)}
        t={t}
      />
    </div>
  );
}