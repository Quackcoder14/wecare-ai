import { useState } from 'react';
import { useTranslation } from '../../i18n/context';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getServices } from '../../services';
import type { PatientCreateRequest, AssessmentResponse } from '../../types/api';
import { BasicInfoStep } from './BasicInfoStep';
import { VitalsStep } from './VitalsStep';
import { SymptomsStep } from './SymptomsStep';
import { MedicalHistoryStep } from './MedicalHistoryStep';
import { ReviewStep } from './ReviewStep';
import { RiskAssessmentResultStep } from './RiskAssessmentResultStep';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useNotifications } from '../../context/NotificationsContext';

type FlowStep = 'basic' | 'vitals' | 'symptoms' | 'history' | 'review' | 'result';

export function NewPatientPage() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const services = getServices();
  const { pushHighRiskAlert } = useNotifications();

  const [step, setStep] = useState<FlowStep>('basic');
  const [submitting, setSubmitting] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Form State
  const [formData, setFormData] = useState<PatientCreateRequest>({
    name: '',
    gender: 'male',
    age: 33,
    symptoms: [],
    symptom_onset: '',
    vitals: {
      heart_rate_bpm: 128,
      temperature_c: 40.5,
      systolic_bp_mmhg: 229,
      diastolic_bp_mmhg: 106,
      respiratory_rate_per_min: 16,
      spo2_percent: 98.0,
    },
    medical_history: 'No History',
    preferred_language: locale,
    input_method: 'manual',
    transcript: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateBasicInfo = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Patient name is required';
    }

    const ageNum = Number(formData.age);
    if (!formData.age || formData.age === 0) {
      newErrors.age = 'Age is required';
    } else if (isNaN(ageNum) || !Number.isInteger(ageNum)) {
      newErrors.age = 'Must be a whole number';
    } else if (ageNum <= 0) {
      newErrors.age = 'Must be greater than 0';
    } else if (ageNum > 120) {
      newErrors.age = 'Must be 120 or younger';
    }

    setErrors(newErrors);
    setTouched({ name: true, age: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Step transitions
  const goToVitals = () => {
    if (validateBasicInfo()) {
      setStep('vitals');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToSymptoms = () => {
    setStep('symptoms');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToHistory = () => {
    setStep('history');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToReview = () => {
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submission handler
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // 1. Submit patient data
      const payload: PatientCreateRequest = {
        ...formData,
        age: Number(formData.age),
      };

      const patientResponse = await services.patient.createPatient(payload, t);
      setPatientId(patientResponse.patient_id);

      // 2. Request deterministic clinical risk assessment
      const assessment = await services.assessment.createAssessment(
        { patient_id: patientResponse.patient_id },
        t
      );

      setAssessmentResult(assessment);

      // Fire notification if high-risk (red acuity or HIGH risk level)
      const isHighRisk =
        (assessment.acuity && String(assessment.acuity).toLowerCase() === 'red') ||
        (assessment.risk_level && assessment.risk_level === 'HIGH');
      if (isHighRisk) {
        const summary = assessment.clinical_summary
          ? assessment.clinical_summary.slice(0, 80)
          : `Risk score ${assessment.risk_score ?? '—'} — immediate attention required`;
        pushHighRiskAlert({
          patientId: patientResponse.patient_id,
          patientIdDisplay: patientResponse.name || formData.name || patientResponse.patient_id,
          acuity: 'red',
          riskScore: assessment.risk_score ?? 85,
          reason: summary,
          department: assessment.recommended_department,
        });
      }

      setStep('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err?.message || 'Failed to analyze patient risk. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      gender: 'male',
      age: 33,
      symptoms: [],
      symptom_onset: '',
      vitals: {
        heart_rate_bpm: 128,
        temperature_c: 40.5,
        systolic_bp_mmhg: 229,
        diastolic_bp_mmhg: 106,
        respiratory_rate_per_min: 16,
        spo2_percent: 98.0,
      },
      medical_history: 'No History',
      preferred_language: locale,
      input_method: 'manual',
      transcript: '',
    });
    setAssessmentResult(null);
    setPatientId(null);
    setError(null);
    setStep('basic');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Steps breadcrumb list
  const stepsList = [
    { id: 'basic', label: `1. ${t('intake.sections.patientInfo')}` },
    { id: 'vitals', label: `2. ${t('intake.sections.vitalSigns')}` },
    { id: 'symptoms', label: `3. ${t('intake.sections.symptoms')}` },
    { id: 'history', label: `4. ${t('intake.symptoms.medicalHistoryLabel')}` },
    { id: 'review', label: `5. ${t('intake.sections.review')}` },
  ];

  const currentStepIndex = stepsList.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-[#f0f7fb] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (step === 'basic') navigate('/');
              else setShowLeaveConfirm(true);
            }}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              WeCare AI Clinical Triage
            </span>
          </div>
        </div>

        {/* Multi-step progress bar (shown during intake steps) */}
        {step !== 'result' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="grid grid-cols-5 gap-2">
              {stepsList.map((s, idx) => {
                const isActive = step === s.id;
                const isPassed = currentStepIndex > idx;
                return (
                  <div key={s.id} className="space-y-2 text-center">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isActive
                          ? 'bg-[#0f2942]'
                          : isPassed
                          ? 'bg-blue-400'
                          : 'bg-slate-200'
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold hidden sm:inline-block ${
                        isActive
                          ? 'text-[#0f2942] font-bold'
                          : isPassed
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Error Banner if API error occurs */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-800 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Basic Information */}
        {step === 'basic' && (
          <BasicInfoStep
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={handleFieldChange}
            onBlur={handleBlur}
            onNext={goToVitals}
          />
        )}

        {/* Step 2: Vitals (Sliders matching Screenshot 1) */}
        {step === 'vitals' && (
          <VitalsStep
            age={Number(formData.age)}
            gender={formData.gender || 'male'}
            vitals={formData.vitals || {}}
            onAgeChange={(newAge) => handleFieldChange('age', newAge)}
            onGenderChange={(newGender) => handleFieldChange('gender', newGender)}
            onVitalsChange={(newVitals) => handleFieldChange('vitals', newVitals)}
            onBack={() => setStep('basic')}
            onNext={goToSymptoms}
          />
        )}

        {/* Step 3: Symptoms (Voice + 28 Symptoms matching Screenshot 2) */}
        {step === 'symptoms' && (
          <SymptomsStep
            selectedSymptoms={formData.symptoms}
            transcript={formData.transcript || ''}
            preferredLanguage={formData.preferred_language || 'en'}
            onSymptomsChange={(newSymptoms) => handleFieldChange('symptoms', newSymptoms)}
            onTranscriptChange={(newTranscript) => {
              handleFieldChange('transcript', newTranscript);
              handleFieldChange('input_method', 'voice');
            }}
            onBack={() => setStep('vitals')}
            onNext={goToHistory}
          />
        )}

        {/* Step 4: Medical History (Upload + Conditions matching Screenshot 3) */}
        {step === 'history' && (
          <MedicalHistoryStep
            medicalHistory={formData.medical_history || 'No History'}
            onMedicalHistoryChange={(newHistory) => handleFieldChange('medical_history', newHistory)}
            onBack={() => setStep('symptoms')}
            onNext={goToReview}
          />
        )}

        {/* Step 5: Review (4-card summary matching Screenshot 4) */}
        {step === 'review' && (
          <ReviewStep
            formData={formData}
            submitting={submitting}
            onBack={() => setStep('history')}
            onConfirm={handleFinalSubmit}
          />
        )}

        {/* Step 6: Risk Assessment Results (matching Screenshot 5) */}
        {step === 'result' && assessmentResult && (
          <RiskAssessmentResultStep
            assessment={assessmentResult}
            patientId={patientId || 'PT-DEMO'}
            formData={formData}
            onReset={handleReset}
          />
        )}

      </div>

      {/* Leave Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLeaveConfirm}
        title="Leave Form?"
        message="Your progress will be lost if you return to dashboard without submitting."
        confirmLabel="Leave"
        cancelLabel="Stay"
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={() => {
          setShowLeaveConfirm(false);
          navigate('/');
        }}
      />
    </div>
  );
}
