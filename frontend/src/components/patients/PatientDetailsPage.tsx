import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, RotateCcw, CheckCircle } from 'lucide-react';
import { getServices } from '../../services';
import { PageHeader } from '../common/PageHeader';
import { AssessmentHistory } from './AssessmentHistory';
import { ReassessmentForm } from './ReassessmentForm';
import { LoadingState, ErrorState, InlineError } from '../common';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatTimeAgo, getAcuityDisplay, getReviewStatusDisplay } from '../../services/assessmentService';
import { AcuityBadge, ReviewStatusBadge } from '../dashboard/AcuityBadge';
import { formatVitalsForDisplay } from '../../services/patientService';

interface PatientDetail {
  patient_id: string;
  age: number;
  symptoms: string[];
  symptom_onset?: string;
  vitals?: {
    heart_rate_bpm?: number;
    respiratory_rate_per_min?: number;
    spo2_percent?: number;
    systolic_bp_mmhg?: number;
    temperature_c?: number;
  };
  medical_history?: string;
  preferred_language: string;
  input_method: string;
  transcript?: string;
  created_at: string;
  assessments: AssessmentResponse[];
}

interface AssessmentResponse {
  assessment_id: string;
  patient_id: string;
  acuity: 'red' | 'yellow' | 'green';
  reasons: string[];
  missing_information: string[];
  review_required: boolean;
  rules_version: string;
  assessed_at: string;
}

type Tab = 'overview' | 'history' | 'reassess';

export function PatientDetailsPage() {
  const { t, locale } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const services = getServices();

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [showAcknowledgeConfirm, setShowAcknowledgeConfirm] = useState<string | null>(null);

  const loadPatient = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await services.patient.getPatient(id, t);
      setPatient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [id, services.patient, t]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  const handleAcknowledge = async (assessmentId: string) => {
    setShowAcknowledgeConfirm(assessmentId);
  };

  const confirmAcknowledge = async (assessmentId: string) => {
    setAcknowledging(assessmentId);
    try {
      await services.assessment.acknowledgeAssessment({ assessment_id: assessmentId }, t);
      // Refresh patient data
      await loadPatient();
      setShowAcknowledgeConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setAcknowledging(null);
      setShowAcknowledgeConfirm(null);
    }
  };

  const handleReassessmentComplete = async () => {
    await loadPatient();
    setActiveTab('overview');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <PageHeader title={t('patientDetails.title')} subtitle={t('patientDetails.subtitle')} />
        <LoadingState message={t('common.loading')} />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <PageHeader
          title={t('patientDetails.title')}
          subtitle={t('patientDetails.subtitle')}
          action={
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              {t('common.back')}
            </button>
          }
        />
        <ErrorState message={error || t('patientDetails.overview.empty')} onRetry={loadPatient} />
      </div>
    );
  }

  const latestAssessment = patient.assessments[patient.assessments.length - 1];
  const acuityDisplay = getAcuityDisplay(latestAssessment?.acuity || 'unknown', t);
  const reviewDisplay = getReviewStatusDisplay(latestAssessment?.review_required ? 'pending' : 'not_required', t);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        title={t('patientDetails.title')}
        subtitle={t('patientDetails.subtitle')}
        action={
          <button onClick={() => navigate('/')} className="btn btn-ghost flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('common.back')}
          </button>
        }
      />

      {/* Patient header card */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-charcoal">{patient.patient_id}</h2>
            <p className="text-secondary">{t('patientDetails.overview.age')}: {patient.age}</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <AcuityBadge category={latestAssessment?.acuity || 'unknown'} size="lg" />
            <ReviewStatusBadge status={latestAssessment?.review_required ? 'pending' : 'not_required'} size="md" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="border-b border-border">
          <nav className="flex -mb-px" role="tablist" aria-label="Patient details sections">
            {([
              { key: 'overview', label: t('patientDetails.tabs.overview') },
              { key: 'history', label: t('patientDetails.tabs.history') },
              { key: 'reassess', label: t('patientDetails.tabs.reassess') },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                role="tab"
                aria-selected={activeTab === key}
                aria-controls={`${key}-panel`}
                id={`${key}-tab`}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-teal text-teal'
                    : 'border-transparent text-secondary hover:text-charcoal hover:bg-pale-blue'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        <div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab" className="p-5">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Assessment */}
              {latestAssessment && (
                <section aria-labelledby="current-assessment-heading">
                  <h3 id="current-assessment-heading" className="text-lg font-semibold text-charcoal mb-4">
                    {t('patientDetails.overview.currentAssessment')}
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="card p-4">
                        <p className="text-sm text-secondary">{t('patientDetails.overview.acuity')}</p>
                        <AcuityBadge category={latestAssessment.acuity} size="md" />
                      </div>
                      <div className="card p-4">
                        <p className="text-sm text-secondary">{t('patientDetails.overview.assessedAt')}</p>
                        <p className="font-medium text-charcoal">{formatTimeAgo(latestAssessment.assessed_at, t)}</p>
                      </div>
                      <div className="card p-4">
                        <p className="text-sm text-secondary">{t('patientDetails.overview.rulesVersion')}</p>
                        <p className="font-mono text-sm text-charcoal">{latestAssessment.rules_version}</p>
                      </div>
                    </div>

                    <div className="card p-4">
                      <h4 className="font-medium text-charcoal mb-2">{t('patientDetails.overview.reasons')}</h4>
                      <ul className="space-y-2" role="list">
                        {latestAssessment.reasons.map((reason, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-charcoal">
                            <span className="w-5 h-5 rounded-full bg-teal/10 flex items-center justify-center text-teal text-xs font-bold flex-shrink-0">
                              {index + 1}
                            </span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {latestAssessment.missing_information.length > 0 && (
                      <div className="card p-4 border-yellow-200 bg-yellow-50">
                        <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" aria-hidden="true" />
                          {t('patientDetails.overview.missingInfo')}
                        </h4>
                        <ul className="space-y-1" role="list">
                          {latestAssessment.missing_information.map((item, index) => (
                            <li key={index} className="text-sm text-yellow-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="card p-4">
                      <h4 className="font-medium text-charcoal mb-2">{t('patientDetails.overview.vitalSigns')}</h4>
                      <div className="space-y-1">
                        {formatVitalsForDisplay(patient.vitals, t).map((v, i) => (
                          <p key={i} className="text-sm text-charcoal">• {v}</p>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      {latestAssessment.review_required && (
                        <button
                          onClick={() => handleAcknowledge(latestAssessment.assessment_id)}
                          disabled={acknowledging === latestAssessment.assessment_id}
                          className="btn btn-outline flex items-center gap-2"
                        >
                          {acknowledging === latestAssessment.assessment_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <CheckCircle className="w-4 h-4" aria-hidden="true" />
                          )}
                          {t('patientDetails.actions.acknowledge')}
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTab('reassess')}
                        className="btn btn-primary flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" aria-hidden="true" />
                        {t('patientDetails.actions.reassess')}
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Intake Information */}
              <section aria-labelledby="intake-info-heading">
                <h3 id="intake-info-heading" className="text-lg font-semibold text-charcoal mb-4">
                  {t('patientDetails.overview.patientId')}: {patient.patient_id}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card p-4">
                    <p className="text-sm text-secondary">{t('patientDetails.overview.age')}</p>
                    <p className="font-medium text-charcoal">{patient.age}</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-sm text-secondary">{t('header.language')}</p>
                    <p className="font-medium text-charcoal">{patient.preferred_language.toUpperCase()}</p>
                  </div>
                  <div className="card p-4">
                    <p className="text-sm text-secondary">{t('intake.sections.symptoms')}</p>
                    <p className="font-medium text-charcoal">
                      {patient.symptoms.filter(s => s.trim()).join(', ') || '—'}
                    </p>
                  </div>
                  {patient.symptom_onset && (
                    <div className="card p-4">
                      <p className="text-sm text-secondary">{t('intake.symptoms.onsetLabel')}</p>
                      <p className="font-medium text-charcoal">{patient.symptom_onset}</p>
                    </div>
                  )}
                  {patient.medical_history && (
                    <div className="card p-4">
                      <p className="text-sm text-secondary">{t('intake.symptoms.medicalHistoryLabel')}</p>
                      <p className="font-medium text-charcoal">{patient.medical_history}</p>
                    </div>
                  )}
                  <div className="card p-4">
                    <p className="text-sm text-secondary">{t('intake.sections.inputMethod')}</p>
                    <p className="font-medium text-charcoal">
                      {patient.input_method === 'voice' ? t('intake.inputMethod.voice') : t('intake.inputMethod.manual')}
                    </p>
                  </div>
                  {patient.transcript && (
                    <div className="card p-4 md:col-span-2">
                      <p className="text-sm text-secondary">{t('intake.review.transcript')}</p>
                      <p className="font-medium text-charcoal">{patient.transcript}</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* History Tab */}
        <div role="tabpanel" id="history-panel" aria-labelledby="history-tab" className="p-5">
          {activeTab === 'history' && (
            <AssessmentHistory
              assessments={patient.assessments}
              formatTimeAgo={(ts) => formatTimeAgo(ts, t)}
              getAcuityDisplay={(cat) => getAcuityDisplay(cat, t)}
              t={t}
            />
          )}
        </div>

        {/* Reassess Tab */}
        <div role="tabpanel" id="reassess-panel" aria-labelledby="reassess-tab" className="p-5">
          {activeTab === 'reassess' && (
            <ReassessmentForm
              patient={patient}
              onComplete={handleReassessmentComplete}
              t={t}
            />
          )}
        </div>
      </div>

      {/* Acknowledge confirmation dialog */}
      <ConfirmDialog
        isOpen={!!showAcknowledgeConfirm}
        onClose={() => setShowAcknowledgeConfirm(null)}
        onConfirm={() => confirmAcknowledge(showAcknowledgeConfirm!)}
        title={t('patientDetails.actions.acknowledge')}
        message="This will mark the review as acknowledged. This action cannot be undone."
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        variant="primary"
        loading={acknowledging === showAcknowledgeConfirm}
      />
    </div>
  );
}