import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../../i18n/context';
import { useNavigate, useLocation } from 'react-router-dom';
import { getServices } from '../../services';
import type { QueueItem } from '../../types/api';
import type { QueueFilter } from '../../services/queueService';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { animate, stagger } from 'animejs';


// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({
  value, label, variant, icon, loading, pulse
}: {
  value: number; label: string; variant: 'default' | 'red' | 'yellow'; icon: React.ReactNode; loading?: boolean; pulse?: boolean;
}) {
  const styles = {
    default: { card: 'db-stat-card db-stat-default', icon: 'db-stat-icon-default' },
    red:     { card: 'db-stat-card db-stat-red',     icon: 'db-stat-icon-red' },
    yellow:  { card: 'db-stat-card db-stat-yellow',  icon: 'db-stat-icon-yellow' },
  };
  const s = styles[variant];
  return (
    <div className={s.card}>
      {pulse && !loading && value > 0 && <div className="db-stat-pulse-ring" />}
      <div className={`db-stat-icon-wrap ${s.icon}`}>{icon}</div>
      <div className="db-stat-num">{loading ? '—' : value}</div>
      <div className="db-stat-label">{label}</div>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const services = getServices();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [patientPendingDelete, setPatientPendingDelete] = useState<QueueItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Parse ?highlight= from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hid = params.get('highlight');
    if (hid) {
      setHighlightedId(hid);
      // Clear param from URL without navigation
      const newUrl = location.pathname;
      window.history.replaceState(null, '', newUrl);
      // Clear highlight after 5s
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => setHighlightedId(null), 5000);
    }
    return () => { if (highlightTimer.current) clearTimeout(highlightTimer.current); };
  }, [location.search, location.pathname]);

  // Scroll highlighted row into view
  useEffect(() => {
    if (highlightedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedId, queue]);

  const loadQueue = useCallback(async () => {
    try {
      setError(null);
      const response = await services.queue.getQueue(t);
      setQueue(response.items);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [services.queue, t]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadQueue();
  }, [loadQueue]);

  const handleDeletePatient = async () => {
    if (!patientPendingDelete) return;
    setDeleting(true);
    try {
      await services.patient.deletePatient(patientPendingDelete.patient_id, t);
      setQueue(current => current.filter(item => item.patient_id !== patientPendingDelete.patient_id));
      setPatientPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove patient from the queue');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30_000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  // Anime.js: stagger-in stat cards and queue rows when data loads
  useEffect(() => {
    if (loading || !pageRef.current) return;
    const statCards = pageRef.current.querySelectorAll('.db-stat-card');
    const queueSection = pageRef.current.querySelector('.db-queue-section');
    if (statCards.length) {
      animate(statCards, {
        opacity: [0, 1], translateY: [16, 0], scale: [0.94, 1],
        duration: 480, easing: 'easeOutBack',
        delay: stagger(70, { start: 80 }),
      });
    }
    if (queueSection) {
      animate(queueSection, { opacity: [0, 1], translateY: [12, 0], duration: 420, easing: 'easeOutExpo', delay: 300 });
    }
  }, [loading]);

  const filteredQueue = queue
    .filter(item => {
      switch (filter) {
        case 'red':          return item.acuity === 'red';
        case 'yellow':       return item.acuity === 'yellow';
        case 'green':        return item.acuity === 'green';
        case 'needs_review': return item.review_status === 'pending';
        default:             return true;
      }
    })
    .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0));

  const summary = {
    total:       queue.length,
    red:         queue.filter(i => i.acuity === 'red').length,
    needsReview: queue.filter(i => i.review_status === 'pending').length,
  };

  const hasRedAlert = summary.red > 0;
  const filterOptions: { value: QueueFilter; label: string }[] = [
    { value: 'all', label: t('dashboard.filters.all') },
    { value: 'red', label: t('dashboard.filters.red') },
    { value: 'yellow', label: t('dashboard.filters.yellow') },
    { value: 'green', label: t('dashboard.filters.green') },
    { value: 'needs_review', label: t('dashboard.filters.needsReview') },
  ];

  return (
    <div className="db-page" ref={pageRef}>
      {/* Header */}
      <div className="db-header">
        <div>
          <div className="db-header-eyebrow">{t('dashboard.title')}</div>
          <h1 className="db-header-title">{t('dashboard.subtitle')}</h1>
        </div>
        <div className="db-header-actions">
          <div className="db-refresh-meta">
            Last updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            onClick={() => navigate('/new-patient')}
            className="db-btn-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('nav.newPatient')}
          </button>
          <button onClick={handleRefresh} disabled={refreshing} className="db-btn-ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'db-spin' : ''}>
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Red alert banner */}
      {hasRedAlert && !loading && (
        <div className="db-alert-banner">
          <div className="db-alert-pulse" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{summary.red} patient{summary.red > 1 ? 's' : ''} require immediate attention</span>
        </div>
      )}

      {/* Stat cards */}
      <div className="db-stats-row">
        <StatCard
          value={summary.total}
          label={t('dashboard.summaryCards.waiting')}
          variant="default"
          loading={loading}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          value={summary.red}
          label={t('dashboard.summaryCards.highAcuity')}
          variant="red"
          loading={loading}
          pulse
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
        />
        <StatCard
          value={summary.needsReview}
          label={t('dashboard.summaryCards.needsReview')}
          variant="yellow"
          loading={loading}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
      </div>

      {/* Queue section */}
      <div className="db-queue-section">
        <div className="db-queue-header">
          <h2 className="db-queue-title">{t('dashboard.queue.title')}</h2>
          <div className="db-filter-pills">
            {filterOptions.map(opt => (
              <button
                key={opt.value}
                className={`db-filter-pill ${filter === opt.value ? 'db-filter-pill-active' : ''}`}
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
                {opt.value !== 'all' && (
                  <span className="db-filter-count">
                    {opt.value === 'red' ? summary.red :
                     opt.value === 'needs_review' ? summary.needsReview :
                     queue.filter(i => i.acuity === opt.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="db-error-box">
            <p>Failed to load patient queue.</p>
            <button onClick={handleRefresh} className="db-btn-ghost">Retry</button>
          </div>
        ) : loading ? (
          <div className="db-table-wrap">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="db-row-skeleton" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="db-empty-state">
            <div className="db-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="db-empty-text">No patients in this category</p>
            <button onClick={() => navigate('/new-patient')} className="db-btn-primary">
              Register New Patient
            </button>
          </div>
        ) : (
          <div className="db-table-wrap">
            {/* Table header */}
            <div className="db-table-head">
              <div className="db-col-pos">#</div>
              <div className="db-col-name">Patient</div>
              <div className="db-col-acuity">Acuity</div>
              <div className="db-col-review">Review</div>
              <div className="db-col-assessment">Assessment</div>
              <div className="db-col-action"></div>
            </div>
            {/* Table rows */}
            <div className="db-table-body">
              {filteredQueue.map((item, index) => {
                const isHighlighted = item.patient_id === highlightedId;
                return (
                  <QueueRow
                    key={item.patient_id}
                    item={item}
                    index={index}
                    onClick={() => navigate(`/patients/${item.patient_id}`)}
                    highlighted={isHighlighted}
                    rowRef={isHighlighted ? highlightRef : null}
                    onDelete={() => setPatientPendingDelete(item)}
                    t={t}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={patientPendingDelete !== null}
        onClose={() => !deleting && setPatientPendingDelete(null)}
        onConfirm={handleDeletePatient}
        title="Remove patient from the queue?"
        message={`This will remove ${patientPendingDelete?.patient_name || patientPendingDelete?.patient_id || 'this patient'} from the active priority queue. This action can’t be undone.`}
        confirmLabel="Remove patient"
        cancelLabel="Keep patient"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

function QueueRow({
  item, index, onClick, onDelete, highlighted, rowRef, t,
}: {
  item: QueueItem;
  index: number;
  onClick: () => void;
  onDelete: () => void;
  highlighted: boolean;
  rowRef: React.RefObject<HTMLDivElement | null> | null;
  t: (key: string) => string;
}) {
  const isRed = item.acuity === 'red';

  // Acuity display values (no rounded pill box)
  const acuityMeta: Record<string, { dot: string; label: string }> = {
    red:    { dot: '#D64545', label: t('assessment.acuityLabels.red') },
    yellow: { dot: '#D97706', label: t('assessment.acuityLabels.yellow') },
    green:  { dot: '#059669', label: t('assessment.acuityLabels.green') },
  };
  const acuity = acuityMeta[item.acuity] ?? { dot: '#94a3b8', label: item.acuity };

  // Review display (inline text, not pill)
  const reviewMeta: Record<string, { color: string; label: string; icon: string }> = {
    pending:      { color: '#D97706', label: t('assessment.reviewLabels.required'), icon: '⚠' },
    acknowledged: { color: '#059669', label: t('assessment.reviewLabels.acknowledged'), icon: '✓' },
    not_required: { color: '#94a3b8', label: '—', icon: '' },
  };
  const review = reviewMeta[item.review_status] ?? reviewMeta.not_required;

  return (
    <div
      ref={rowRef as React.RefObject<HTMLDivElement>}
      className={`db-table-row ${isRed ? 'db-table-row-red' : ''} ${highlighted ? 'db-table-row-highlight' : ''}`}
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Position */}
      <div className="db-col-pos">
        <span className={`db-pos-badge ${isRed ? 'db-pos-badge-red' : ''}`}>{index + 1}</span>
      </div>

      {/* Patient name / ID */}
      <div className="db-col-name">
        <div className="db-patient-avatar" style={{ background: getAvatarColor(item.patient_id) }}>
          {getInitials(item.patient_name, item.patient_id)}
        </div>
        <div className="db-patient-info">
          <span className="db-patient-name">{item.patient_name || item.patient_id.slice(0, 8).toUpperCase()}</span>
          <span className="db-patient-id">{item.patient_name ? `${item.patient_id.slice(0, 8).toUpperCase()} · Age ${item.age}` : `Age ${item.age}`}</span>
        </div>
        {item.review_status === 'pending' && (
          <div className="db-review-dot" title="Review required" />
        )}
      </div>

      {/* Acuity — clean text + dot + risk score badge */}
      <div className="db-col-acuity">
        <span className="db-acuity-inline">
          <span className="db-acuity-dot" style={{ background: acuity.dot }} />
          <span className="db-acuity-label" style={{ color: acuity.dot }}>{acuity.label}</span>
        </span>
        {item.risk_score != null && (
          <span
            className="db-risk-badge"
            style={{ color: acuity.dot, borderColor: acuity.dot + '55' }}
            title="Risk score (0-100)"
          >
            {item.risk_score}
          </span>
        )}
      </div>

      {/* Review */}
      <div className="db-col-review">
        <span className="db-review-inline" style={{ color: review.color }}>
          {review.icon && <span style={{ marginRight: 3 }}>{review.icon}</span>}
          {review.label}
        </span>
      </div>

      {/* Assessment */}
      <div className="db-col-assessment">
        <span className="db-assessment-text">{item.assessment_summary || '—'}</span>
      </div>

      {/* Action */}
      <div className="db-col-action">
        <button className="db-view-btn" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {t('common.view')}
        </button>
        <button
          className="db-delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label={`Remove ${item.patient_name || item.patient_id} from queue`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v5m4-5v5" />
          </svg>
          {t('common.delete')}
        </button>
      </div>
    </div>
  );
}

function getInitials(name?: string, id?: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (id || 'PT').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  '#4F46E5', '#0891B2', '#059669', '#D97706',
  '#7C3AED', '#DB2777', '#0EA5E9', '#10B981',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
