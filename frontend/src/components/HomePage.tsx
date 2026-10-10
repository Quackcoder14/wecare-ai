import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { getServices } from '../services';
import { useNotifications } from '../context/NotificationsContext';
import type { QueueItem } from '../types/api';
import { animate, stagger } from 'animejs';

export function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const services = getServices();
  const { unreadCount } = useNotifications();
  const pageRef = useRef<HTMLDivElement>(null);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = useCallback(async () => {
    try {
      const response = await services.queue.getQueue(t);
      setQueue(response.items);
    } catch {
      // fail silently on home overview
    } finally {
      setLoading(false);
    }
  }, [services.queue, t]);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30_000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  // Anime.js entrance animation
  useEffect(() => {
    if (!pageRef.current) return;
    const brandEl = pageRef.current.querySelector('.home-brand');
    const overviewEl = pageRef.current.querySelector('.home-overview');
    const navCards = pageRef.current.querySelectorAll('.home-nav-card');
    const statCards = pageRef.current.querySelectorAll('.home-stat');

    if (brandEl) {
      animate(brandEl, { opacity: [0, 1], translateY: [-24, 0], duration: 600, easing: 'easeOutExpo' });
    }
    if (overviewEl) {
      animate(overviewEl, { opacity: [0, 1], translateY: [20, 0], duration: 700, easing: 'easeOutExpo', delay: 150 });
    }
    if (statCards.length) {
      animate(statCards, { opacity: [0, 1], scale: [0.92, 1], duration: 500, easing: 'easeOutBack', delay: stagger(80, { start: 250 }) });
    }
    if (navCards.length) {
      animate(navCards, { opacity: [0, 1], translateY: [28, 0], scale: [0.95, 1], duration: 550, easing: 'easeOutBack', delay: stagger(90, { start: 400 }) });
    }
  }, []);

  const summary = {
    total: queue.length,
    red: queue.filter(i => i.acuity === 'red').length,
    needsReview: queue.filter(i => i.review_status === 'pending').length,
  };

  const navItems = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      sublabel: t('dashboard.queue.title'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="8" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="15" width="7" height="6" rx="1.5" />
        </svg>
      ),
      color: 'nav-teal',
      onClick: () => navigate('/dashboard'),
    },
    {
      id: 'new-patient',
      label: t('nav.newPatient'),
      sublabel: t('intake.subtitle'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      ),
      color: 'nav-blue',
      onClick: () => navigate('/new-patient'),
    },
    {
      id: 'notifications',
      label: t('nav.notifications'),
      sublabel: unreadCount > 0 ? `${unreadCount} ${t('nav.notifications')}` : t('assessment.reviewLabels.required'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      color: 'nav-purple',
      onClick: () => navigate('/notifications'),
      disabled: false,
      badge: unreadCount,
    },
  ];

  return (
    <div className="home-full-page" ref={pageRef}>
      <div className="home-full-inner">
        {/* ── Brand header ── */}
        <div className="home-brand">
          <div className="home-brand-icon">
            <svg viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="url(#homeIconGrad)" />
              <path d="M24 12v24M12 24h24" stroke="white" strokeWidth="4" strokeLinecap="round" />
              <defs>
                <linearGradient id="homeIconGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1AD8DA" />
                  <stop offset="100%" stopColor="#087F80" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="home-brand-title">WeCare<span>.AI</span></h1>
            <p className="home-brand-sub">{t('app.subtitle')}</p>
          </div>
        </div>

        {/* ── Emergency Overview ── */}
        <section className="home-overview">
          <div className="home-overview-eyebrow">{t('dashboard.title')}</div>
          <div className="home-overview-heading">{t('dashboard.subtitle')}</div>

          <div className="home-stats-row">
            {/* Patients Waiting */}
            <div className="home-stat home-stat-default">
              <div className="home-stat-icon-wrap home-stat-icon-teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="home-stat-value">{loading ? '—' : summary.total}</div>
              <div className="home-stat-label">{t('dashboard.summaryCards.waiting')}</div>
            </div>

            {/* High Acuity */}
            <div className="home-stat home-stat-red">
              {!loading && summary.red > 0 && <div className="home-stat-pulse-dot" />}
              <div className="home-stat-icon-wrap home-stat-icon-red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="home-stat-value">{loading ? '—' : summary.red}</div>
              <div className="home-stat-label">{t('dashboard.summaryCards.highAcuity')}</div>
            </div>

            {/* Needs Review */}
            <div className="home-stat home-stat-yellow">
              <div className="home-stat-icon-wrap home-stat-icon-yellow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="home-stat-value">{loading ? '—' : summary.needsReview}</div>
              <div className="home-stat-label">{t('dashboard.summaryCards.needsReview')}</div>
            </div>
          </div>
        </section>

        {/* ── Nav buttons – horizontal row ── */}
        <div className="home-nav-row">
          {navItems.map((item, i) => (
            <button
              key={item.id}
              className={`home-nav-card home-nav-card-${item.color} ${item.disabled ? 'home-nav-card-disabled' : ''}`}
              style={{ animationDelay: `${i * 70}ms` }}
              onClick={item.onClick}
              disabled={item.disabled}
            >
              <div className="home-nav-card-icon" style={{ position: 'relative' }}>
                {item.icon}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="home-nav-badge">{item.badge}</span>
                )}
              </div>
              <div className="home-nav-card-label">{item.label}</div>
              <div className="home-nav-card-sub">{item.sublabel}</div>
              {item.disabled && <span className="home-nav-card-chip">Soon</span>}
              {!item.disabled && (
                <div className="home-nav-card-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
