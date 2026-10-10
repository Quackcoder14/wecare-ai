import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type AppNotification } from '../../context/NotificationsContext';
import { Bell, ArrowRight, CheckCheck, Trash2, ShieldAlert } from 'lucide-react';
import { animate, stagger } from 'animejs';

function timeAgo(dateString: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  const h = Math.floor(diffSec / 3600);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    const cards = listRef.current.querySelectorAll('.notif-card');
    if (cards.length) {
      animate(cards, {
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.96, 1],
        duration: 420,
        easing: 'easeOutBack',
        delay: stagger(60, { start: 80 }),
      });
    }
  }, [notifications.length]);

  const handlePatientClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    navigate(`/dashboard?highlight=${encodeURIComponent(notif.patientId)}`);
  };

  return (
    <div className="notif-page">
      <div className="notif-page-header">
        <div>
          <p className="notif-page-eyebrow">Clinical updates</p>
          <div className="notif-title-row">
              <h1 className="notif-page-title">Notifications &amp; acuity alerts</h1>
              {unreadCount > 0 && (
                <span className="notif-unread-badge">{unreadCount} new</span>
              )}
          </div>
          <p className="notif-page-subtitle">A focused record of priority-queue changes and patient escalations.</p>
        </div>

        <div className="notif-page-actions">
          {notifications.length > 0 && (
            <>
              <button
                type="button"
                className="notif-btn-secondary"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck size={16} />
                <span>Mark all read</span>
              </button>
              <button
                type="button"
                className="notif-btn-danger"
                onClick={clearAll}
                title="Clear all notifications"
              >
                <Trash2 size={16} />
                <span>Clear history</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">
              <Bell size={40} />
            </div>
            <h3 className="notif-empty-title">All caught up</h3>
            <p className="notif-empty-sub">
              There are no new patient acuity alerts or queue updates at this time.
            </p>
            <button
              type="button"
              className="db-btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              Go to Patient Queue
            </button>
          </div>
        ) : (
          <div className="notif-feed" ref={listRef}>
            {notifications.map((notif) => {
              const isRed = notif.acuity === 'red';
              return (
                <div
                  key={notif.id}
                  className={`notif-card ${!notif.read ? 'notif-card-unread' : ''} ${isRed ? 'notif-card-critical' : ''}`}
                  onClick={() => handlePatientClick(notif)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePatientClick(notif);
                    }
                  }}
                >
                  <div className={`notif-icon-wrap ${isRed ? 'notif-icon-critical' : 'notif-icon-moderate'}`}>
                      <ShieldAlert size={18} />
                  </div>

                  <div className="notif-body">
                    <div className="notif-card-head">
                      <div className="notif-card-patient">
                        <span className="notif-title">Priority queue update</span>
                        <span className="notif-patient-id">{notif.patientIdDisplay}</span>
                        {notif.department && (
                          <span className="notif-dept-tag">{notif.department}</span>
                        )}
                        <span className={`notif-acuity-tag ${isRed ? 'notif-acuity-red' : 'notif-acuity-yellow'}`}>
                          {isRed ? 'High Acuity' : 'Medium Acuity'} (Score: {notif.riskScore})
                        </span>
                      </div>
                      <span className="notif-time">{timeAgo(notif.timestamp)}</span>
                    </div>

                    <p className="notif-msg">{notif.reason}</p>

                    <div className="notif-card-footer">
                      <span className="notif-hint">Queue status updated</span>
                      <div className="notif-action">
                        <span>View in Queue</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
