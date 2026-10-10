import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Users } from 'lucide-react';
import { useTranslation } from '../../i18n/context';
import { getServices } from '../../services';
import type { PatientResponse } from '../../types/api';

export function PatientRecordsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const services = getServices();
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = useCallback(async () => {
    try {
      setError(null);
      const data = await services.patient.listPatients(t);
      setPatients([...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [services.patient, t]);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  return (
    <div className="db-page">
      <div className="db-header">
        <div>
          <div className="db-header-eyebrow">{t('nav.patientRecords')}</div>
          <h1 className="db-header-title">{t('nav.patientRecords')}</h1>
        </div>
        <button onClick={() => navigate('/new-patient')} className="db-btn-primary"><Plus />{t('nav.newPatient')}</button>
      </div>
      {error ? <div className="db-error-box"><p>{error}</p><button className="db-btn-ghost" onClick={loadPatients}>{t('common.retry')}</button></div> : loading ? <div className="db-table-wrap"><div className="db-row-skeleton" /></div> : patients.length === 0 ? (
        <div className="db-empty-state"><div className="db-empty-icon"><Users /></div><p className="db-empty-text">{t('dashboard.queue.emptyState')}</p></div>
      ) : (
        <div className="db-table-wrap" role="list">
          {patients.map((patient, index) => (
            <button key={patient.patient_id} role="listitem" className="records-row" onClick={() => navigate(`/patients/${patient.patient_id}`)}>
              <span className="records-position">{index + 1}</span>
              <span className="records-avatar">{(patient.name || patient.patient_id).slice(0, 2).toUpperCase()}</span>
              <span className="records-person"><strong>{patient.name || patient.patient_id}</strong><small>{patient.patient_id} · {t('patientDetails.overview.age')} {patient.age}</small></span>
              <time>{new Date(patient.created_at).toLocaleString()}</time><FileText />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
