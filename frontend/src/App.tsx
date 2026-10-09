import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n/context';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { NewPatientPage } from './components/intake/NewPatientPage';
import { PatientDetailsPage } from './components/patients/PatientDetailsPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/new-patient" element={<NewPatientPage />} />
      <Route path="/patients/:id" element={<PatientDetailsPage />} />
      <Route path="/patients" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </BrowserRouter>
    </I18nProvider>
  );
}

export default App;