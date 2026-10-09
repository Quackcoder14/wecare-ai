import { Plus, Trash2, Stethoscope } from 'lucide-react';
import type { PatientCreateRequest } from '../../types/api';

interface PatientIntakeFormProps {
  formData: PatientCreateRequest;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onChange: (name: string, value: any) => void;
  onBlur: (name: string) => void;
  onAddSymptom: () => void;
  onRemoveSymptom: (index: number) => void;
  onSymptomChange: (index: number, value: string) => void;
  t: (key: string) => string;
  locale: string;
}

export function PatientIntakeForm({
  formData,
  errors,
  touched,
  onChange,
  onBlur,
  onAddSymptom,
  onRemoveSymptom,
  onSymptomChange,
  t,
}: PatientIntakeFormProps) {
  const showAgeError = Boolean(touched.age && errors.age);

  return (
    <div className="space-y-6">
      {/* Section: Patient Information */}
      <section className="card p-5" aria-labelledby="patient-info-heading">
        <h2 id="patient-info-heading" className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-teal" aria-hidden="true" />
          {t('intake.sections.patientInfo')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Age */}
          <div>
            <label htmlFor="age" className="label">
              {t('intake.patientInfo.ageLabel')} <span className="text-acuity-red" aria-hidden="true">*</span>
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={(e) => onChange('age', e.target.value)}
              onBlur={() => onBlur('age')}
              placeholder={t('intake.patientInfo.agePlaceholder')}
              className={`input ${showAgeError ? 'input-error' : ''}`}
              aria-invalid={showAgeError}
              aria-describedby={showAgeError ? 'age-error' : undefined}
              min="1"
              max="150"
              step="1"
              required
            />
            {showAgeError && (
              <p id="age-error" className="error-text" role="alert">{errors.age}</p>
            )}
          </div>

          {/* Language (read-only, from global selector) */}
          <div>
            <label className="label">{t('header.language')}</label>
            <div className="input bg-pale-blue cursor-default">
              {formData.preferred_language.toUpperCase()}
            </div>
            <p className="help-text">{t('intake.patientInfo.agePlaceholder')}</p>
          </div>
        </div>
      </section>

      {/* Section: Symptoms */}
      <section className="card p-5" aria-labelledby="symptoms-heading">
        <h2 id="symptoms-heading" className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-teal" aria-hidden="true" />
          {t('intake.sections.symptoms')}
        </h2>

        {/* Structured symptoms */}
        <div className="mb-4">
          <label className="label">{t('intake.symptoms.structuredSymptoms')}</label>
          <div className="space-y-2" role="list" aria-label={t('intake.symptoms.structuredSymptoms')}>
            {formData.symptoms.map((symptom, index) => (
              <div key={index} className="flex items-center gap-2" role="listitem">
                <input
                  type="text"
                  value={symptom}
                  onChange={(e) => onSymptomChange(index, e.target.value)}
                  placeholder={`${t('intake.symptoms.placeholder')} ${index + 1}`}
                  className="input flex-1"
                  aria-label={`${t('intake.symptoms.label')} ${index + 1}`}
                />
                {formData.symptoms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveSymptom(index)}
                    className="btn btn-ghost p-1.5 text-secondary hover:text-acuity-red"
                    aria-label={`${t('intake.symptoms.removeSymptom')} ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={onAddSymptom}
              className="btn btn-outline flex items-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              {t('intake.symptoms.addSymptom')}
            </button>
          </div>

          {/* Free text symptoms */}
          <div>
            <label htmlFor="symptom_onset" className="label">
              {t('intake.symptoms.onsetLabel')}
            </label>
            <input
              type="text"
              id="symptom_onset"
              name="symptom_onset"
              value={formData.symptom_onset}
              onChange={(e) => onChange('symptom_onset', e.target.value)}
              onBlur={() => onBlur('symptom_onset')}
              placeholder={t('intake.symptoms.onsetPlaceholder')}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="medical_history" className="label">
              {t('intake.symptoms.medicalHistoryLabel')}
            </label>
            <textarea
              id="medical_history"
              name="medical_history"
              value={formData.medical_history}
              onChange={(e) => onChange('medical_history', e.target.value)}
              onBlur={() => onBlur('medical_history')}
              placeholder={t('intake.symptoms.medicalHistoryPlaceholder')}
              className="input min-h-[80px] resize-y"
              rows={3}
            />
          </div>
        </div>
      </section>
    </div>
  );
}