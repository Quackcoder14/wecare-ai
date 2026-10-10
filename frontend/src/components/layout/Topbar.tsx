import { useTranslation } from '../../i18n/context';
import { LanguageSelector } from './LanguageSelector';
import { ConnectionStatus } from './ConnectionStatus';
import { Menu, Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';

interface TopbarProps {
  onMenuClick: () => void;
  isMobile: boolean;
}

export function Topbar({ onMenuClick, isMobile }: TopbarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-30 h-16 border-b flex items-center px-4 md:px-6" style={{
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderColor: 'rgba(255,255,255,0.65)',
      boxShadow: '0 2px 12px rgba(8,70,120,0.07)',
    }}>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={onMenuClick}
          className="btn btn-ghost p-2 mr-2 md:hidden"
          aria-label={t('a11y.openMenu')}
          aria-expanded="false"
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>
      )}

      {/* Page title - will be set by pages via context or props */}
      <div className="flex-1 min-w-0">
        <h1 id="page-title" className="text-lg font-semibold text-charcoal truncate">
          WeCare.AI
        </h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Language selector */}
        <LanguageSelector />

        {/* Connection status */}
        <ConnectionStatus />

        <button
          onClick={() => navigate('/notifications')}
          className="btn btn-ghost p-2 relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-acuity-red" aria-hidden="true" />}
        </button>

        {/* User menu (placeholder) */}
        <div className="flex items-center gap-2 pl-2 md:pl-4 border-l border-border ml-2 md:ml-4 hidden sm:flex">
          <User className="w-5 h-5 text-secondary" aria-hidden="true" />
          <span className="text-sm text-secondary">{t('header.userRole')}</span>
        </div>
      </div>
    </header>
  );
}
