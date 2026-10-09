import type { VitalsInput } from '../../types/api';

interface VitalsFormProps {
  vitals: VitalsInput;
  onChange: (vitals: VitalsInput) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onBlur: (name: string) => void;
  t: (key: string) => string;
}

const VITAL_FIELDS = [
  { key: 'heart_rate_bpm', label: 'intake.vitalSigns.heartRate.label', unit: 'intake.vitalSigns.heartRate.unit', placeholder: 'intake.vitalSigns.heartRate.placeholder', min: 20, max: 300, step: 1 },
  { key: 'respiratory_rate_per_min', label: 'intake.vitalSigns.respiratoryRate.label', unit: 'intake.vitalSigns.respiratoryRate.unit', placeholder: 'intake.vitalSigns.respiratoryRate.placeholder', min: 0, max: 100, step: 1 },
  { key: 'spo2_percent', label: 'intake.vitalSigns.spo2.label', unit: 'intake.vitalSigns.spo2.unit', placeholder: 'intake.vitalSigns.spo2.placeholder', min: 50, max: 100, step: 1 },
  { key: 'systolic_bp_mmhg', label: 'intake.vitalSigns.systolicBp.label', unit: 'intake.vitalSigns.systolicBp.unit', placeholder: 'intake.vitalSigns.systolicBp.placeholder', min: 40, max: 300, step: 1 },
  { key: 'temperature_c', label: 'intake.vitalSigns.temperature.label', unit: 'intake.vitalSigns.temperature.unit', placeholder: 'intake.vitalSigns.temperature.placeholder', min: 30, max: 45, step: 0.1 },
] as const;

export function VitalsForm({ vitals, onChange, errors, touched, onBlur, t }: VitalsFormProps) {
  return (
    <section className="card p-5" aria-labelledby="vitals-heading">
      <h2 id="vitals-heading" className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        {t('intake.sections.vitalSigns')}
      </h2>

      <p className="help-text mb-4">{t('intake.vitalSigns.missingInfoNote')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {VITAL_FIELDS.map(({ key, label, unit, placeholder, min, max, step = 1 }) => {
          const fieldErrors = errors[key as string];
          const fieldTouched = touched[key as string];
          const showError = Boolean(fieldTouched && fieldErrors);
          const value = vitals[key as keyof typeof vitals];

          return (
            <div key={key}>
              <label htmlFor={key} className="label">
                {t(label)} <span className="text-secondary">({t(unit)})</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id={key}
                  name={key}
                  value={value ?? ''}
                  onChange={(e) => {
                    const numValue = e.target.value === '' ? undefined : Number(e.target.value);
                    onChange({ ...vitals, [key]: numValue });
                  }}
                  onBlur={() => onBlur(key)}
                  placeholder={t(placeholder)}
                  className={`input pr-16 ${showError ? 'input-error' : ''}`}
                  aria-invalid={showError}
                  aria-describedby={showError ? `${key}-error` : undefined}
                  min={min}
                  max={max}
                  step={step}
                  inputMode="numeric"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-secondary pointer-events-none">
                  {t(unit)}
                </span>
              </div>
              {showError && (
                <p id={`${key}-error`} className="error-text" role="alert">{fieldErrors}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}