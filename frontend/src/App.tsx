import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { I18nProvider } from './i18n/context';
import { useI18n } from './i18n/context';
import type { Locale } from './i18n';
import { SplashScreen } from './components/SplashScreen';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './components/HomePage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { NewPatientPage } from './components/intake/NewPatientPage';
import { PatientDetailsPage } from './components/patients/PatientDetailsPage';
import { PatientRecordsPage } from './components/patients/PatientRecordsPage';
import { NotificationsPage } from './components/notifications/NotificationsPage';
import { NotificationsProvider } from './context/NotificationsContext';
import { AlertToast } from './components/notifications/AlertToast';

const SPLASH_KEY = 'wecare-splash-done';

function AppInner() {
  const { setLocale } = useI18n();
  const [splashDone, setSplashDone] = useState<boolean>(() => {
    return localStorage.getItem(SPLASH_KEY) === 'true';
  });

  const handleLanguageSelect = (locale: Locale) => {
    setLocale(locale);
    localStorage.setItem(SPLASH_KEY, 'true');
    setSplashDone(true);
  };

  if (!splashDone) {
    return <SplashScreen onLanguageSelect={handleLanguageSelect} />;
  }

  return (
    <BrowserRouter>
      {/* Global alert toast — sits above everything */}
      <AlertToast />

      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/new-patient" element={<NewPatientPage />} />
          <Route path="/patients/:id" element={<PatientDetailsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/patients" element={<PatientRecordsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

function App() {
  return (
    <I18nProvider>
      <NotificationsProvider>
        <AppInner />
      </NotificationsProvider>
    </I18nProvider>
  );
}

export default App;
