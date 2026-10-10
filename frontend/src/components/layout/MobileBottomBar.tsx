import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Activity, UserPlus, Bell, FileText } from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';
import { useTranslation } from '../../i18n/context';

export function MobileBottomBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { t } = useTranslation();

  const isCurrent = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/dashboard', label: t('nav.dashboard'), icon: Activity },
    { path: '/new-patient', label: t('nav.newPatient'), icon: UserPlus, isCenter: true },
    { path: '/notifications', label: t('nav.notifications'), icon: Bell, badge: unreadCount },
    { path: '/patients', label: t('nav.patientRecords'), icon: FileText },
  ];

  return (
    <nav
      className="mobile-bottom-nav md:hidden"
      role="navigation"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.86)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 -4px 20px rgba(8, 70, 120, 0.08), 0 -1px 3px rgba(8, 70, 120, 0.04)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        paddingTop: '6px',
        paddingLeft: '12px',
        paddingRight: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        {navItems.map((item) => {
          const active = isCurrent(item.path);
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className="mobile-nav-fab"
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                style={{
                  position: 'relative',
                  top: '-12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0E9F9F 0%, #086B6D 100%)',
                  color: '#ffffff',
                  boxShadow: '0 6px 18px rgba(8, 127, 128, 0.35)',
                  border: '3px solid rgba(255, 255, 255, 0.9)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  flexShrink: 0,
                }}
              >
                <Icon size={22} strokeWidth={2.4} />
              </button>
            );
          }

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className="mobile-nav-btn"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: '4px 8px',
                background: 'transparent',
                border: 'none',
                color: active ? '#087F80' : '#64748B',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                minWidth: '56px',
                position: 'relative',
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} strokeWidth={active ? 2.3 : 1.8} />
                {Boolean(item.badge && item.badge > 0) && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-8px',
                      background: '#D64545',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      minWidth: '15px',
                      height: '15px',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                      lineHeight: 1,
                      border: '1.5px solid white',
                    }}
                  >
                    {item.badge! > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: active ? 700 : 500,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </span>
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    width: '16px',
                    height: '2.5px',
                    borderRadius: '9999px',
                    background: '#087F80',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
