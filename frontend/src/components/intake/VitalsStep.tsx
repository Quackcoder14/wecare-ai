import { Heart, Thermometer, Activity, Wind, Droplets } from 'lucide-react';
import type { VitalsInput } from '../../types/api';

interface VitalsStepProps {
  age: number;
  gender: string;
  vitals: VitalsInput;
  onAgeChange: (age: number) => void;
  onGenderChange: (gender: string) => void;
  onVitalsChange: (vitals: VitalsInput) => void;
  onBack: () => void;
  onNext: () => void;
}

/** Clamp a value between min and max */
const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

export function VitalsStep({
  age,
  gender,
  vitals,
  onAgeChange,
  onGenderChange,
  onVitalsChange,
  onBack,
  onNext,
}: VitalsStepProps) {
  const currentHeartRate = vitals.heart_rate_bpm ?? 80;
  const currentTemp = vitals.temperature_c ?? 37.0;
  const currentSystolic = vitals.systolic_bp_mmhg ?? 120;
  const currentDiastolic = vitals.diastolic_bp_mmhg ?? 80;
  const currentRespRate = vitals.respiratory_rate_per_min ?? 16;
  const currentSpo2 = vitals.spo2_percent ?? 98.0;

  const updateVital = (field: keyof VitalsInput, value: number) => {
    onVitalsChange({ ...vitals, [field]: value });
  };

  const sliderStyle: React.CSSProperties = {
    WebkitAppearance: 'none',
    appearance: 'none',
    width: '100%',
    height: '10px',
    borderRadius: '8px',
    background: '#bde0fe',
    outline: 'none',
    cursor: 'pointer',
    accentColor: '#148F91',
  };

  /** Renders slider + editable number input for integer vitals */
  function IntVital({
    label, icon, value, min, max, unit, field,
  }: {
    label: string; icon: React.ReactNode; value: number;
    min: number; max: number; unit: string;
    field: keyof VitalsInput;
  }) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {icon}
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>{label}</span>
        </div>
        <input
          type="range" min={min} max={max} value={value}
          onChange={(e) => updateVital(field, parseInt(e.target.value, 10))}
          style={sliderStyle}
          className="vital-slider"
        />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <input
            type="number"
            min={min} max={max}
            value={value}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) updateVital(field, clamp(v, min, max));
            }}
            className="vital-number-input"
            aria-label={label}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>{unit}</span>
        </div>
      </div>
    );
  }

  /** Renders slider + editable number input for float vitals */
  function FloatVital({
    label, icon, value, min, max, step, unit, field, decimals,
  }: {
    label: string; icon: React.ReactNode; value: number;
    min: number; max: number; step: number; unit: string;
    field: keyof VitalsInput; decimals: number;
  }) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {icon}
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>{label}</span>
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => updateVital(field, parseFloat(e.target.value))}
          style={sliderStyle}
          className="vital-slider"
        />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <input
            type="number"
            min={min} max={max} step={step}
            value={value.toFixed(decimals)}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) updateVital(field, clamp(v, min, max));
            }}
            className="vital-number-input"
            aria-label={label}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>{unit}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page Title */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f2942', marginBottom: '0.25rem' }}>
          Record Vitals
        </h2>
        <p style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>
          Adjust sliders or tap the number to type the exact value
        </p>
      </div>

      {/* Main Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        padding: '2rem 2.5rem',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0 3rem',
        }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* Age */}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>Age</div>
              <input
                type="range" min="1" max="120" value={age || 33}
                onChange={(e) => onAgeChange(parseInt(e.target.value, 10))}
                style={sliderStyle}
                className="vital-slider"
              />
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <input
                  type="number"
                  min={1} max={120}
                  value={age || 33}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) onAgeChange(clamp(v, 1, 120));
                  }}
                  className="vital-number-input"
                  aria-label="Age"
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>years</span>
              </div>
            </div>

            <IntVital
              label="Heart Rate" field="heart_rate_bpm"
              icon={<Heart style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />}
              value={currentHeartRate} min={40} max={220} unit="BPM"
            />

            <IntVital
              label="Systolic BP" field="systolic_bp_mmhg"
              icon={<Activity style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />}
              value={currentSystolic} min={70} max={260} unit="mmHg"
            />

            <IntVital
              label="Respiratory Rate" field="respiratory_rate_per_min"
              icon={<Wind style={{ width: '1rem', height: '1rem', color: '#14b8a6' }} />}
              value={currentRespRate} min={8} max={50} unit="breaths/min"
            />
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* Gender */}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>Gender</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => onGenderChange('male')}
                  style={{
                    backgroundColor: (gender || 'male') === 'male' ? '#148F91' : '#e0f2fe',
                    color: (gender || 'male') === 'male' ? '#ffffff' : '#0f2942',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => onGenderChange('female')}
                  style={{
                    backgroundColor: gender === 'female' ? '#148F91' : '#e0f2fe',
                    color: gender === 'female' ? '#ffffff' : '#0f2942',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Female
                </button>
              </div>
            </div>

            <FloatVital
              label="Temperature" field="temperature_c"
              icon={<Thermometer style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />}
              value={currentTemp} min={34.0} max={42.5} step={0.1} unit="°C" decimals={1}
            />

            <IntVital
              label="Diastolic BP" field="diastolic_bp_mmhg"
              icon={<Activity style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />}
              value={currentDiastolic} min={40} max={160} unit="mmHg"
            />

            <FloatVital
              label="Oxygen Saturation" field="spo2_percent"
              icon={<Droplets style={{ width: '1rem', height: '1rem', color: '#06b6d4' }} />}
              value={currentSpo2} min={70.0} max={100.0} step={0.5} unit="%" decimals={1}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
        <button type="button" onClick={onBack} className="intake-btn-secondary">
          <span>←</span>
          <span>Back to Basic Info</span>
        </button>
        <button type="button" onClick={onNext} className="intake-btn-primary">
          <span>Next: Select Symptoms</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
