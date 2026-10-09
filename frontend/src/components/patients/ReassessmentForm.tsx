import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import { Loader2, RotateCcw, AlertCircle, CheckCircle, Stethoscope } from 'lucide-react';
import { getServices } from '../../services';
import type { PatientDetail, VitalsInput } from '../../types/api';
import { validatePatientCreate, formatVitalsForDisplay } from '../../services/patientService';
import { PatientIntakeForm } from '../intake/PatientIntakeForm';
import { VitalsForm } from '../intake/VitalsForm';
import { LoadingState, ErrorState, InlineError } from '../common';
import { AcuityBadge, ReviewStatusBadge } from '../dashboard/AcuityBadge';

interface ReassessmentFormProps {
  patient: PatientDetail;
  onComplete: () => Promise<void>;
  t: (key: string) => string;
}

export function ReassessmentForm({ patient, onComplete, t }: ReassessmentFormProps) {
  const services = getServices();
  const latestAssessment = patient.assessments[patient.assessments.length - 1];

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Form state - initialize with latest patient data
  const [formData, setFormData] = useState({
    age: patient.age,
    symptoms: [...patient.symptoms],
    symptom_onset: patient.symptom_onset || '',
    vitals: { ...patient.vitals } as VitalsInput,
    medical_history: patient.medical_history || '',
    preferred_language: patient.preferred_language,
    input_method: patient.input_method,
    transcript: patient.transcript || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: any) => {
    const newErrors = { ...errors };
    if (name === 'age') {
      if (!value || value === '') {
        newErrors.age = t('intake.validation.required');
      } else if (!Number.isInteger(Number(value))) {
        newErrors.age = t('intake.validation.mustBeInteger');
      } else if (Number(value) <= 0) {
        newErrors.age = t('intake.validation.mustBePositive');
      } else if (Number(value) > 150) {
        newErrors.age = t('intake.validation.maxValue');
      } else {
        delete newErrors.age;
      }
      setErrors(newErrors);
    }
  }, [errors, t]);

  const handleChange = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
  }, [touched, validateField]);

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name as keyof typeof formData]);
  }, [formData, validateField]);

  const handleSymptomChange = useCallback((index: number, value: string) => {
    setFormData(prev => {
      const newSymptoms = [...prev.symptoms];
      newSymptoms[index] = value;
      return { ...prev, symptoms: newSymptoms };
    });
  }, []);

  const handleAddSymptom = useCallback(() => {
    setFormData(prev => ({ ...prev, symptoms: [...prev.symptoms, ''] }));
  }, []);

  const handleRemoveSymptom = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index),
    }));
  }, []);

  const handleVitalsChange = useCallback((vitals: VitalsInput) => {
    setFormData(prev => ({ ...prev, vitals }));
  }, []);

  const canSubmit = useCallback(() => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    if (!formData.age || formData.age === '') {
      newErrors.age = t('intake.validation.required');
      valid = false;
    } else if (!Number.isInteger(Number(formData.age))) {
      newErrors.age = t('intake.validation.mustBeInteger');
      valid = false;
    } else if (Number(formData.age) <= 0) {
      newErrors.age = t('intake.validation.mustBePositive');
      valid = false;
    } else if (Number(formData.age) > 150) {
      newErrors.age = t('intake.validation.maxValue');
      valid = false;
    }

    const hasSymptoms = formData.symptoms.some(s => s.trim());
    const hasVitals = formData.vitals && (
      formData.vitals.heart_rate_bpm !== undefined ||
      formData.vitals.respiratory_rate_per_min !== undefined ||
      formData.vitals.spo2_percent !== undefined ||
      formData.vitals.systolic_bp_mmhg !== undefined ||
      formData.vitals.temperature_c !== undefined
    );

    if (!hasSymptoms && !hasVitals && !formData.transcript?.trim()) {
      newErrors.general = 'Please enter at least one symptom, vital sign, or transcript.';
      valid = false;
    }

    setErrors(newErrors);
    setTouched({ age: true, symptoms: true, vitals: true });
    return valid;
  }, [formData, t]);

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setSubmitting(true);
    setError(null);

    try {
      const assessment = await services.assessment.reassessPatient(
        {
          patient_id: patient.patient_id,
          symptoms: formData.symptoms,
          symptom_onset: formData.symptom_onset,
          vitals: formData.vitals,
          medical_history: formData.medical_history,
        },
        t
      );

      setResult(assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Show current assessment for reference
  if (result) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="card p-5 bg-acuity-green/5 border-acuity-green/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-acuity-green/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-acuity-green" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-charcoal">{t('patientDetails.reassess.success')}</h3>
              <p className="text-secondary">{t('patientDetails.reassess.changedValues')}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-semibold text-charcoal mb-3">{t('assessment.title')}</h3>
          <div className="flex items-center gap-4 mb-4">
            <AcuityBadge category={result.acuity} size="lg" />
            <ReviewStatusBadge status={result.review_required ? 'pending' : 'not_required'} size="md" />
          </div>
          <p className="text-sm text-secondary mb-4">{t('assessment.assessmentId')}: {result.assessment_id}</p>
          <ul className="space-y-2" role="list">
            {result.reasons.map((reason: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-charcoal">
                <span className="w-5 h-5 rounded-full bg-teal/10 flex items-center justify-center text-teal text-xs font-bold flex-shrink-0">
                  {index + 1}
                </span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={async () => {
              await onComplete();
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" aria-hidden="true" />
            {t('common.back')}
          </button>
          <button
            onClick={() => {
              setResult(null);
              setErrors({});
              setTouched({});
            }}
            className="btn btn-outline flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-charcoal mb-2">{t('patientDetails.reassess.title')}</h2>
        <p className="text-secondary">{t('patientDetails.reassess.subtitle')}</p>

        {/* Current assessment reference */}
        {latestAssessment && (
          <div className="mt-4 p-3 bg-pale-blue rounded-lg">
            <p className="text-sm text-secondary mb-2">{t('patientDetails.overview.currentAssessment')}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <AcuityBadge category={latestAssessment.acuity} size="sm" />
              <ReviewStatusBadge status={latestAssessment.review_required ? 'pending' : 'not_required'} size="sm" />
              <span className="text-sm text-secondary">
                {t('assessment.assessedAt')}: {formatTimeAgo(latestAssessment.assessed_at, t)}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <ErrorState message={error} onRetry={handleSubmit} retryLabel={t('common.retry')} />
      )}

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <PatientIntakeForm
          formData={formData}
          errors={errors}
          touched={touched}
          onChange={handleChange}
          onBlur={handleBlur}
          onAddSymptom={handleAddSymptom}
          onRemoveSymptom={handleRemoveSymptom}
          onSymptomChange={handleSymptomChange}
          t={t}
          locale={patient.preferred_language}
        />

        <VitalsForm
          vitals={formData.vitals}
          onChange={handleVitalsChange}
          errors={errors}
          touched={touched}
          onBlur={handleBlur}
          t={t}
        />

        {errors.general && <InlineError message={errors.general} />}

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary flex-1 sm:flex-none"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                {t('patientDetails.reassess.submitting')}
              </>
            ) : (
              t('patientDetails.reassess.submit')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}