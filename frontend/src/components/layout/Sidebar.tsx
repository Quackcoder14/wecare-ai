import { useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  FileText,
  HelpCircle,
  Shield,
  Heart,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/new-patient', icon: UserPlus, labelKey: 'nav.newPatient' },
  { path: '/patients', icon: FileText, labelKey: 'nav.patientRecords' },
  { path: '/help', icon: HelpCircle, labelKey: 'nav.help' },
];

export function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const { t, locale } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, onClose]);

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-full transition-transform duration-300 ease-out ${
        isMobile
          ? isOpen
            ? 'translate-x-0'
            : '-translate-x-full'
          : 'translate-x-0'
      }`}
      style={{
        width: isMobile ? '280px' : 'var(--sidebar-width)',
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex flex-col h-full bg-surface border-r border-border">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-powder-blue">
            <Shield className="w-6 h-6 text-teal" aria-hidden="true" />
            <Heart className="w-6 h-6 text-teal absolute" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-charcoal truncate">{t('app.name')}</h1>
            <p className="text-xs text-secondary truncate">{t('app.subtitle')}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" role="list">
          {NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => handleNavClick(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-powder-blue text-teal'
                    : 'text-charcoal hover:bg-pale-blue hover:text-teal'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal`}
                role="listitem"
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{t(labelKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>WeCare.AI v0.1.0</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-acuity-green" aria-hidden="true" />
              <span>{locale.toUpperCase()}</span>
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}