import { PatientQueueRow } from './PatientQueueRow';
import { EmptyQueue } from '../common/EmptyState';
import type { QueueItem } from '../../types/api';

interface PatientQueueProps {
  items: QueueItem[];
  onRowClick: (patientId: string) => void;
  onNewPatient?: () => void;
  formatTimeAgo: (timestamp: string) => string;
  getAcuityDisplay: (category: string) => { label: string; color: string; bgColor: string };
  getReviewStatusDisplay: (status: string) => { label: string; color: string; bgColor: string };
  t: (key: string) => string;
}

export function PatientQueue({
  items,
  onRowClick,
  onNewPatient,
  formatTimeAgo,
  getAcuityDisplay,
  getReviewStatusDisplay,
  t,
}: PatientQueueProps) {
  if (items.length === 0) {
    return <EmptyQueue onNewPatient={onNewPatient || (() => {})} />;
  }

  return (
    <div className="card overflow-hidden" role="region" aria-label={t('dashboard.queue.title')}>
      {/* Table header - desktop only */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-secondary border-b border-border">
        <div className="col-span-2">{t('dashboard.queue.patientId')}</div>
        <div className="col-span-1">{t('dashboard.queue.age')}</div>
        <div className="col-span-2">{t('dashboard.queue.acuity')}</div>
        <div className="col-span-4">{t('dashboard.queue.assessment')}</div>
        <div className="col-span-2">{t('dashboard.queue.waitingTime')}</div>
        <div className="col-span-1">{t('dashboard.queue.reviewStatus')}</div>
        <div className="col-span-1"></div>
      </div>

      {/* Queue rows */}
      <div className="divide-y divide-border">
        {items.map((item, index) => (
          <PatientQueueRow
            key={item.patient_id}
            item={item}
            index={index}
            onClick={() => onRowClick(item.patient_id)}
            formatTimeAgo={formatTimeAgo}
            getAcuityDisplay={getAcuityDisplay}
            getReviewStatusDisplay={getReviewStatusDisplay}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}