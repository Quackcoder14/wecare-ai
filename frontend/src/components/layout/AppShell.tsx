import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/context';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { getServices, setUseMock } from '../../services';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const services = getServices();
    // Check if we're using mock by trying to access the config
    const config = (services as any).patient?.constructor?.name?.includes('mock');
    setIsDemoMode(config || false);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell flex min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal/50"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        isMobile={isMobile}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <Topbar
          onMenuClick={toggleSidebar}
          isMobile={isMobile}
        />

        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="w-full bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center">
            <span className="text-sm font-medium text-yellow-800 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {t('common.demoModeBanner')}
            </span>
          </div>
        )}

        {/* Main content */}
        <main
          ref={mainRef}
          className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto"
          role="main"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 btn btn-primary"
      >
        Skip to main content
      </a>
    </div>
  );
}