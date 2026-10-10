import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import { animate } from 'animejs';

export function AlertToast() {
  const { activeToast, dismissToast } = useNotifications();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  // Animate in on mount
  useEffect(() => {
    if (!activeToast || !cardRef.current) return;
    animate(cardRef.current, {
      translateY: ['-110%', '0%'],
      opacity: [0, 1],
      scale: [0.96, 1],
      duration: 520,
      easing: 'easeOutBack',
    });

    const timer = setTimeout(() => {
      if (cardRef.current) {
        animate(cardRef.current, {
          translateY: ['0%', '-110%'],
          opacity: [1, 0],
          duration: 380,
          easing: 'easeInExpo',
        });
        setTimeout(dismissToast, 380);
      } else {
        dismissToast();
      }
    }, 7600);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const handleViewQueue = () => {
    const pid = activeToast.patientId;
    dismissToast();
    navigate(`/dashboard?highlight=${encodeURIComponent(pid)}`);
  };

  const handleClose = () => {
    if (cardRef.current) {
      animate(cardRef.current, {
        translateY: ['0%', '-110%'],
        opacity: [1, 0],
        duration: 300,
        easing: 'easeInExpo',
      });
      setTimeout(dismissToast, 300);
    } else {
      dismissToast();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 'max(14px, env(safe-area-inset-top, 14px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100vw - 28px)',
        maxWidth: '520px',
        pointerEvents: 'none',
      }}
      role="alert"
      aria-live="assertive"
    >
      <div
        ref={cardRef}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1.5px solid rgba(214,69,69,0.35)',
          borderRadius: 18,
          padding: '16px 18px 16px 16px',
          boxShadow: '0 12px 40px rgba(214,69,69,0.15), 0 2px 8px rgba(8,70,120,0.1)',
          overflow: 'hidden',
          position: 'relative',
          pointerEvents: 'all',
        }}
      >
        {/* Red accent stripe */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0,
          width: 4,
          background: 'linear-gradient(180deg, #D64545, #ff6b6b)',
          borderRadius: '18px 0 0 18px',
        }} />

        {/* Alert icon */}
        <div style={{
          flexShrink: 0,
          marginLeft: 8,
          width: 38, height: 38,
          background: 'rgba(214,69,69,0.12)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#D64545',
        }}>
          <AlertTriangle size={20} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              background: 'rgba(214,69,69,0.12)',
              color: '#c23030',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 9999,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>HIGH RISK ALERT</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Just now</span>
          </div>

          <div style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            color: '#1a3244',
            marginBottom: 4,
            lineHeight: 1.3,
          }}>
            High risk identified — Priority queue updated
          </div>

          <p style={{ fontSize: '0.78rem', color: '#5a7a96', lineHeight: 1.45, margin: 0 }}>
            <strong style={{ color: '#D64545' }}>{activeToast.patientIdDisplay}</strong> (Score: {activeToast.riskScore}) &bull; {activeToast.reason.slice(0, 90)}{activeToast.reason.length > 90 ? '…' : ''}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <button
              type="button"
              onClick={handleViewQueue}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'linear-gradient(135deg, #148F91, #087F80)',
                color: 'white', border: 'none', borderRadius: 8,
                fontSize: '0.78rem', fontWeight: 700,
                padding: '6px 14px', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(20,143,145,0.3)',
              }}
            >
              <span>View in Queue</span>
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: 'transparent', border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 8, fontSize: '0.78rem', fontWeight: 500,
                padding: '6px 12px', cursor: 'pointer', color: '#5a7a96',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close X */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close notification"
          style={{
            flexShrink: 0, width: 26, height: 26,
            background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#94a3b8', cursor: 'pointer',
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
