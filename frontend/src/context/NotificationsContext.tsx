import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface AppNotification {
  id: string;
  patientId: string;
  patientIdDisplay: string;
  acuity: 'red' | 'yellow' | 'green';
  riskScore: number;
  reason: string;
  timestamp: string;
  read: boolean;
  department?: string;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  activeToast: AppNotification | null;
  dismissToast: () => void;
  pushHighRiskAlert: (data: {
    patientId: string;
    patientIdDisplay?: string;
    acuity?: 'red' | 'yellow' | 'green';
    riskScore?: number;
    reason?: string;
    department?: string;
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const STORAGE_KEY = 'wecare_notifications_v1';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-seed-1',
    patientId: 'PT-1002',
    patientIdDisplay: 'PT-1002',
    acuity: 'red',
    riskScore: 92,
    reason: 'Critical: Acute chest pain radiating to left arm with SpO2 88% and tachycardia.',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    read: false,
    department: 'Emergency & Cardiology',
  },
  {
    id: 'notif-seed-2',
    patientId: 'PT-1005',
    patientIdDisplay: 'PT-1005',
    acuity: 'red',
    riskScore: 88,
    reason: 'High Risk: Severe dyspnea with bilateral wheezing and altered mental status.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read: false,
    department: 'Pulmonology / ICU',
  },
  {
    id: 'notif-seed-3',
    patientId: 'PT-1008',
    patientIdDisplay: 'PT-1008',
    acuity: 'red',
    riskScore: 84,
    reason: 'Acuity escalated: Sustained hypotensive episode (BP 82/50) with diaphoresis.',
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    read: true,
    department: 'Critical Care Triage',
  },
];

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const pushHighRiskAlert = useCallback((data: {
    patientId: string;
    patientIdDisplay?: string;
    acuity?: 'red' | 'yellow' | 'green';
    riskScore?: number;
    reason?: string;
    department?: string;
  }) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientId: data.patientId,
      patientIdDisplay: data.patientIdDisplay || data.patientId,
      acuity: data.acuity || 'red',
      riskScore: data.riskScore ?? 85,
      reason: data.reason || 'High acuity detected. Patient priority queue has changed.',
      timestamp: new Date().toISOString(),
      read: false,
      department: data.department || 'Emergency Triage',
    };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast(newNotif);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToast,
        dismissToast,
        pushHighRiskAlert,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return ctx;
}
