import { Eye, AlertTriangle } from 'lucide-react';
import type { QueueItem } from '../../types/api';
import { AcuityBadge, ReviewStatusBadge } from './AcuityBadge';
import { useReducedMotion } from '../../hooks/useMediaQuery';
import { animate } from 'animejs';
import { useRef, useEffect } from 'react';

interface PatientQueueRowProps {
  item: QueueItem;
  index: number;
  onClick: () => void;
  formatTimeAgo: (timestamp: string) => string;
  getAcuityDisplay: (category: string) => { label: string; color: string; bgColor: string };
  getReviewStatusDisplay?: (status: string) => { label: string; color: string; bgColor: string };
  t: (key: string) => string;
}

export function PatientQueueRow({
  item,
  index,
  onClick,
  formatTimeAgo,
  getAcuityDisplay,
  t,
}: PatientQueueRowProps) {
  const reducedMotion = useReducedMotion();
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reducedMotion && rowRef.current) {
      animate(rowRef.current, {
        translateY: [20, 0],
        opacity: [0, 1],
        delay: index * 50,
        duration: 300,
        easing: 'easeOutQuad',
      });
    }
  }, [index, reducedMotion]);

  const acuityDisplay = getAcuityDisplay(item.acuity);
  const waitingTime = formatTimeAgo(item.created_at);

  return (
    <div
      ref={rowRef}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${t('a11y.queueRow')}: ${item.patient_id}, ${t('dashboard.queue.acuity')}: ${acuityDisplay.label}`}
      className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-pale-blue/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
      style={{ opacity: reducedMotion ? 1 : 0, transform: reducedMotion ? 'none' : 'translateY(20px)' }}
    >
      {/* Patient ID */}
      <div className="col-span-12 md:col-span-2 flex items-center gap-2 min-w-0">
        <span className="font-mono text-sm font-medium text-charcoal truncate">{item.patient_id}</span>
        {item.review_status === 'pending' && (
          <span className="flex-shrink-0" aria-label={t('a11y.reviewRequired')}>
            <AlertTriangle className="w-4 h-4 text-yellow-500" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* Age */}
      <div className="col-span-12 md:col-span-1 text-sm text-charcoal">
        {item.age} {t('common.yearsAgo').replace('{{count}} ', '')}
      </div>

      {/* Acuity */}
      <div className="col-span-12 md:col-span-2">
        <AcuityBadge category={item.acuity} size="sm" />
      </div>

      {/* Assessment summary */}
      <div className="col-span-12 md:col-span-4 text-sm text-secondary truncate max-w-xs">
        {item.assessment_summary}
      </div>

      {/* Waiting time */}
      <div className="col-span-12 md:col-span-2 flex items-center gap-1 text-sm text-secondary">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {waitingTime}
      </div>

      {/* Review status */}
      <div className="col-span-12 md:col-span-1">
        <ReviewStatusBadge status={item.review_status as 'pending' | 'acknowledged' | 'not_required'} size="sm" />
      </div>

      {/* Action */}
      <div className="col-span-12 md:col-span-1 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="btn btn-ghost p-1.5 text-secondary hover:text-teal"
          aria-label={`${t('common.view')} ${item.patient_id}`}
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}