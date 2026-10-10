import { User, Activity, Stethoscope, FileText, Loader2 } from 'lucide-react';
import type { PatientCreateRequest } from '../../types/api';

interface ReviewStepProps {
  formData: PatientCreateRequest;
  submitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

export function ReviewStep({ formData, submitting, onBack, onConfirm }: ReviewStepProps) {
  const patientDisplayId = 'PT2026' + String(Math.abs(hashCode(formData.name || 'patient')) % 1000000).padStart(6, '0');

  const sbp = formData.vitals?.systolic_bp_mmhg ?? 120;
  const dbp = formData.vitals?.diastolic_bp_mmhg ?? 80;
  const hr = formData.vitals?.heart_rate_bpm ?? 75;
  const temp = formData.vitals?.temperature_c ?? 37.0;
  const spo2 = formData.vitals?.spo2_percent ?? 98.0;
  const rr = formData.vitals?.respiratory_rate_per_min ?? 16;

  const symptoms = formData.symptoms && formData.symptoms.length > 0
    ? formData.symptoms.filter(s => s && s.trim())
    : ['None reported'];

  const history = formData.medical_history && formData.medical_history.trim()
    ? formData.medical_history
    : 'No History';

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '1.5rem 1.75rem',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  };

  const iconBoxStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: '#dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1e40af',
    flexShrink: 0,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.65rem 0.9rem',
    background: '#f0f7fb',
    borderRadius: '10px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page Title */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f2942', marginBottom: '0.25rem' }}>
          Review Information
        </h2>
        <p style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>
          Please review all information before proceeding
        </p>
      </div>

      {/* 2×2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Card 1: Patient Information */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={iconBoxStyle}>
              <User style={{ width: '1.15rem', height: '1.15rem' }} />
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f2942' }}>Patient Information</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={rowStyle}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Patient ID:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2942' }}>{patientDisplayId}</span>
            </div>
            {formData.name && (
              <div style={rowStyle}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Name:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2942' }}>{formData.name}</span>
              </div>
            )}
            <div style={rowStyle}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Age:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2942' }}>{formData.age} years</span>
            </div>
            <div style={rowStyle}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Gender:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2942' }}>
                {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Male'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Vital Signs */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={iconBoxStyle}>
              <Activity style={{ width: '1.15rem', height: '1.15rem' }} />
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f2942' }}>Vital Signs</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={rowStyle}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Blood Pressure:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2942' }}>{sbp}/{dbp} mmHg</span>
            </div>
            <div style={rowStyle}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Heart Rate:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2942' }}>{hr} BPM</span>
            </div>
            <div style={rowStyle}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Temperature:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2942' }}>{typeof temp === 'number' ? temp.toFixed(1) : temp}°C</span>
            </div>
            <div style={rowStyle}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>SpO2:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2942' }}>{typeof spo2 === 'number' ? spo2.toFixed(1) : spo2}%</span>
            </div>
            <div style={rowStyle}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Resp. Rate:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2942' }}>{rr} breaths/min</span>
            </div>
          </div>
        </div>

        {/* Card 3: Selected Symptoms */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={iconBoxStyle}>
              <Stethoscope style={{ width: '1.15rem', height: '1.15rem' }} />
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f2942' }}>Selected Symptoms</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.25rem' }}>
            {symptoms.map((symptom, i) => (
              <span
                key={i}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  background: '#e0f2fe',
                  color: '#0f2942',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                {symptom}
              </span>
            ))}
          </div>
          {formData.transcript && (
            <div style={{ padding: '0.65rem 0.9rem', borderRadius: '10px', background: '#f0f7fb', border: '1px solid #e0f2fe', marginTop: '0.25rem' }}>
              <span style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.75rem', display: 'block', marginBottom: '2px' }}>Voice Note:</span>
              <span style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic' }}>"{formData.transcript}"</span>
            </div>
          )}
        </div>

        {/* Card 4: Medical History */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={iconBoxStyle}>
              <FileText style={{ width: '1.15rem', height: '1.15rem' }} />
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f2942' }}>Medical History</span>
          </div>
          <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: '#f0f7fb' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>Pre-existing Condition:</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2942' }}>{history}</div>
          </div>
        </div>

      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
        <button type="button" onClick={onBack} disabled={submitting} className="intake-btn-secondary">
          <span>←</span>
          <span>Back to Medical History</span>
        </button>
        <button type="button" onClick={onConfirm} disabled={submitting} className="intake-btn-primary">
          {submitting ? (
            <>
              <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
              <span>Analyzing Clinical Risk...</span>
            </>
          ) : (
            <>
              <span>Confirm & Calculate Risk</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
