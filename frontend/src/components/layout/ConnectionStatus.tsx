import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import { Wifi, WifiOff, RefreshCw, Server } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

type ConnectionState = 'connected' | 'demo' | 'disconnected' | 'checking';

export function ConnectionStatus() {
  const { t, locale } = useTranslation();
  const [state, setState] = useState<ConnectionState>('checking');
  const [retrying, setRetrying] = useState(false);

  const checkConnection = async () => {
    if (apiClient.getConfig().useMock) {
      setState('demo');
      return;
    }

    setState('checking');
    try {
      const response = await fetch(`${apiClient.getConfig().baseUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        setState('connected');
      } else {
        setState('disconnected');
      }
    } catch {
      setState('disconnected');
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [locale]);

  const handleRetry = async () => {
    setRetrying(true);
    await checkConnection();
    setRetrying(false);
  };

  const getStatusConfig = () => {
    switch (state) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-acuity-green',
          bgColor: 'bg-acuity-green/10',
          label: t('header.connectionStatus.connected'),
          iconColor: 'text-acuity-green',
        };
      case 'demo':
        return {
          icon: Server,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: t('header.connectionStatus.demoMode'),
          iconColor: 'text-yellow-600',
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-acuity-red',
          bgColor: 'bg-acuity-red/10',
          label: t('header.connectionStatus.unavailable'),
          iconColor: 'text-acuity-red',
        };
      case 'checking':
      default:
        return {
          icon: RefreshCw,
          color: 'text-secondary',
          bgColor: 'bg-pale-blue',
          label: 'Checking...',
          iconColor: 'text-teal animate-spin',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRetry}
        disabled={retrying || state === 'demo'}
        className={`btn btn-ghost p-1.5 rounded-full ${config.bgColor} ${config.color} transition-colors`}
        aria-label={`${config.label}. ${state === 'disconnected' ? 'Click to retry' : ''}`}
        title={config.label}
      >
        <Icon className={`w-4 h-4 ${config.iconColor}`} aria-hidden="true" />
      </button>
      <span className="hidden md:inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-background border border-border">
        {state === 'demo' && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" aria-hidden="true" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" aria-hidden="true" />
          </span>
        )}
        {config.label}
      </span>
    </div>
  );
}