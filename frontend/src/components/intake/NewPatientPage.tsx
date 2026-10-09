import { useState, useCallback, useRef, useEffect, Fragment } from 'react';
import { useTranslation } from '../../i18n/context';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { getServices } from '../../services';
import type { PatientCreateRequest, VitalsInput } from '../../types/api';
import { formatVitalsForDisplay } from '../../services/patientService';
import { PageHeader } from '../common/PageHeader';
import { PatientIntakeForm } from './PatientIntakeForm';
import { VitalsForm } from './VitalsForm';
import { VoiceRecorder } from './VoiceRecorder';
import { AssessmentResult } from './AssessmentResult';
import { ErrorState, InlineError } from '../common/ErrorState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useReducedMotion } from '../../hooks/useMediaQuery';
import { animate } from 'animejs';

type IntakeStep = 'form' | 'voice' | 'review' | 'result' | 'error';

export function NewPatientPage() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const services = getServices();

  const [step, setStep] = useState<IntakeStep>('form');
  const [submitting, setSubmitting] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Form state
  const [formData, setFormData] = useState<PatientCreateRequest>({
    age: 0,
    symptoms: [''],
    symptom_onset: '',
    vitals: {},
    medical_history: '',
    preferred_language: locale,
    input_method: 'manual',
    transcript: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Voice state
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceConfirmed, setVoiceConfirmed] = useState(false);

  const validateField = useCallback((name: string, value: any) => {
    const newErrors = { ...errors };
    switch (name) {
      case 'age':
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
        break;
    }
    setErrors(newErrors);
  }, [errors, t]);

  const handleChange = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
  }, [touched, validateField]);

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name as keyof PatientCreateRequest]);
  }, [formData, validateField]);

  const handleSymptomChange = useCallback((index: number, value: string) => {
    const newSymptoms = [...formData.symptoms];
    newSymptoms[index] = value;
    setFormData(prev => ({ ...prev, symptoms: newSymptoms }));
  }, [formData.symptoms]);

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

  const handleVoiceTranscript = useCallback((transcript: string, confirmed: boolean) => {
    setVoiceTranscript(transcript);
    setVoiceConfirmed(confirmed);
    setFormData(prev => ({ ...prev, transcript, input_method: 'voice' }));
  }, []);

  const canProceedFromForm = () => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    // Age validation
    if (formData.age === 0 || formData.age === null || formData.age === undefined) {
      newErrors.age = t('intake.validation.required');
      valid = false;
    } else if (!Number.isInteger(formData.age)) {
      newErrors.age = t('intake.validation.mustBeInteger');
      valid = false;
    } else if (Number(formData.age) <= 0) {
      newErrors.age = t('intake.validation.mustBePositive');
      valid = false;
    } else if (Number(formData.age) > 150) {
      newErrors.age = t('intake.validation.maxValue');
      valid = false;
    }

    // At least one symptom or vital or transcript
    const hasSymptoms = formData.symptoms.some(s => s.trim());
    const hasVitals = formData.vitals && (
      formData.vitals.heart_rate_bpm !== undefined ||
      formData.vitals.respiratory_rate_per_min !== undefined ||
      formData.vitals.spo2_percent !== undefined ||
      formData.vitals.systolic_bp_mmhg !== undefined ||
      formData.vitals.temperature_c !== undefined
    );
    const hasTranscript = formData.transcript?.trim();

    if (!hasSymptoms && !hasVitals && !hasTranscript) {
      newErrors.general = t('intake.review.submitError'); // Reusing for now
      valid = false;
    }

    setErrors(newErrors);
    setTouched({ age: true, symptoms: true, vitals: true });
    return valid;
  };

  const handleNext = () => {
    if (step === 'form') {
      if (canProceedFromForm()) {
        if (Number(formData.age) < 12) {
          // Show pediatric warning but allow proceeding
          setStep('review');
        } else {
          setStep(formData.input_method === 'voice' ? 'voice' : 'review');
        }
      }
    } else if (step === 'voice') {
      if (voiceConfirmed || voiceTranscript.trim()) {
        setStep('review');
      }
    } else if (step === 'review') {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === 'voice') setStep('form');
    else if (step === 'review') setStep(formData.input_method === 'voice' ? 'voice' : 'form');
    else if (step === 'result') navigate('/');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Submit patient
      const patientResponse = await services.patient.createPatient(formData, t);
      setPatientId(patientResponse.patient_id);

      // Request assessment
      const assessment = await services.assessment.createAssessment(
        { patient_id: patientResponse.patient_id },
        t
      );

      setAssessmentResult(assessment);
      setStep('result');

      if (!reducedMotion) {
        animate('.result-animation', {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 400,
          easing: 'easeOutQuad',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryAssessment = async () => {
    if (!patientId) return;
    setSubmitting(true);
    setError(null);
    try {
      const assessment = await services.assessment.createAssessment(
        { patient_id: patientId },
        t
      );
      setAssessmentResult(assessment);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewPatient = () => {
    setFormData({
      age: 0,
      symptoms: [''],
      symptom_onset: '',
      vitals: {},
      medical_history: '',
      preferred_language: locale,
      input_method: 'manual',
      transcript: '',
    });
    setVoiceTranscript('');
    setVoiceConfirmed(false);
    setPatientId(null);
    setAssessmentResult(null);
    setErrors({});
    setTouched({});
    setStep('form');
  };

  const steps = [
    { key: 'form', label: t('intake.sections.patientInfo') },
    { key: 'voice', label: t('intake.sections.symptoms') },
    { key: 'review', label: t('intake.sections.review') },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader
        title={t('intake.title')}
        subtitle={t('intake.subtitle')}
        action={
          <button
            onClick={() => navigate('/')}
            className="btn btn-ghost flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('common.back')}
          </button>
        }
      />

      {/* Progress indicator */}
      <div className="mb-6" role="navigation" aria-label="Assessment progress">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <Fragment key={s.key}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    i < currentStepIndex
                      ? 'bg-teal text-white'
                      : i === currentStepIndex
                      ? 'bg-teal text-white ring-4 ring-teal/20'
                      : 'bg-pale-blue text-secondary'
                  }`}
                >
                  {i < currentStepIndex ? (
                    <CheckCircle className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span className="mt-1 text-xs text-center text-secondary max-w-[80px]">
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`hidden md:block flex-1 h-1 mx-2 ${
                    i < currentStepIndex ? 'bg-teal' : 'bg-border'
                  }`}
                  aria-hidden="true"
                />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Error state */}
      {step === 'error' && (
        <ErrorState
          message={error || t('common.error')}
          onRetry={handleRetryAssessment}
          retryLabel={t('common.retry')}
        />
      )}

      {/* Result state */}
      {step === 'result' && assessmentResult && (
        <AssessmentResult
          result={assessmentResult}
          patientId={patientId!}
          onNewPatient={handleNewPatient}
          onViewDetails={() => navigate(`/patients/${patientId}`)}
          className="result-animation"
        />
      )}

      {/* Form steps */}
      {(step === 'form' || step === 'voice' || step === 'review') && (
        <form ref={formRef} className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Step 1: Patient Info & Symptoms */}
          {(step === 'form' || step === 'voice') && (
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
              locale={locale}
            />
          )}

          {/* Step 1 continued: Vitals */}
          {step === 'form' && (
            <VitalsForm
              vitals={formData.vitals || {}}
              onChange={handleVitalsChange}
              errors={errors}
              touched={touched}
              onBlur={(name) => handleBlur(name)}
              t={t}
            />
          )}

          {/* Step 2: Voice Input */}
          {step === 'voice' && (
            <VoiceRecorder
              locale={formData.preferred_language as 'en' | 'ta' | 'te' | 'hi'}
              onTranscript={handleVoiceTranscript}
              initialTranscript={voiceTranscript}
              t={t}
            />
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-charcoal mb-4">{t('intake.review.title')}</h2>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-secondary">{t('intake.review.age')}</dt>
                  <dd className="font-medium text-charcoal">{formData.age}</dd>
                </div>
                <div>
                  <dt className="text-secondary">{t('intake.review.symptoms')}</dt>
                  <dd className="font-medium text-charcoal">
                    {formData.symptoms.filter(s => s.trim()).join(', ') || t('common.loading')}
                  </dd>
                </div>
                {voiceTranscript && (
                  <div>
                    <dt className="text-secondary">{t('intake.review.transcript')}</dt>
                    <dd className="font-medium text-charcoal">{voiceTranscript}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-secondary">{t('intake.review.vitalSigns')}</dt>
                  <dd className="font-medium text-charcoal">
                    {formatVitalsForDisplay(formData.vitals, t).join(', ') || t('intake.vitalSigns.missingInfoNote')}
                  </dd>
                </div>
                <div>
                  <dt className="text-secondary">{t('intake.review.inputMethod')}</dt>
                  <dd className="font-medium text-charcoal">
                    {formData.input_method === 'voice' ? t('intake.inputMethod.voice') : t('intake.inputMethod.manual')}
                  </dd>
                </div>
                <div>
                  <dt className="text-secondary">{t('intake.review.language')}</dt>
                  <dd className="font-medium text-charcoal">{formData.preferred_language.toUpperCase()}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Age under 12 warning */}
          {Number(formData.age) > 0 && Number(formData.age) < 12 && (
            <div className="card p-4 border-acuity-yellow bg-yellow-50" role="alert">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-medium text-yellow-800">{t('intake.patientInfo.ageUnder12')}</p>
                  <p className="text-yellow-700 mt-1 text-sm">{t('intake.patientInfo.ageUnder12Message')}</p>
                </div>
              </div>
            </div>
          )}

          {/* General errors */}
          {errors.general && (
            <InlineError message={errors.general} />
          )}

          {/* Navigation buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
            {(step === 'voice' || step === 'review') && (
              <button
                type="button"
                onClick={handleBack}
                className="btn btn-secondary"
              >
                {t('common.back')}
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="btn btn-primary flex-1 sm:flex-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  {step === 'review' ? t('intake.review.submitting') : t('common.next')}
                </>
              ) : step === 'review' ? (
                t('intake.review.submit')
              ) : (
                t('common.next')
              )}
            </button>
          </div>
        </form>
      )}

      {/* Leave confirmation dialog */}
      <ConfirmDialog
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={() => {
          setShowLeaveConfirm(false);
          navigate('/');
        }}
        title={t('common.confirm')}
        message="You have unsaved changes. Are you sure you want to leave?"
        confirmLabel={t('common.yes')}
        cancelLabel={t('common.no')}
        variant="secondary"
      />
    </div>
  );
}