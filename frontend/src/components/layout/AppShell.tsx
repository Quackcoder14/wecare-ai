import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { useEffect } from 'react';

import { MobileBottomBar } from './MobileBottomBar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const isMobile = useMediaQuery('(max-width: 768px)');

  // Home page gets full-screen treatment
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    setIsDemoMode(apiClient.getConfig().useMock);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  if (isHomePage) {
    return (
      <div className="app-shell-home pb-20 md:pb-0">
        {children}
        <MobileBottomBar />
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-screen" style={{
      background: 'linear-gradient(135deg, #daeeff 0%, #f0f8ff 40%, #cce9ff 70%, #e8f4fe 100%)',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
    }}>
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
          className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto pb-24 md:pb-8"
          role="main"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* Mobile persistent bottom navigation */}
      <MobileBottomBar />

      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 btn btn-primary"
      >
        Skip to main content
      </a>
    </div>
  );
}