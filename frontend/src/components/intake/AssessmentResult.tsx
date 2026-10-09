import { useTranslation } from '../../i18n/context';
import { ArrowRight, CheckCircle, AlertTriangle, Stethoscope, FileText, Plus, Eye } from 'lucide-react';
import { AcuityBadge, ReviewStatusBadge } from '../dashboard/AcuityBadge';
import { formatTimeAgo } from '../../services/assessmentService';
import { useReducedMotion } from '../../hooks/useMediaQuery';
import { animate } from 'animejs';
import { useRef, useEffect } from 'react';

interface AssessmentResultProps {
  result: {
    assessment_id: string;
    patient_id: string;
    acuity: 'red' | 'yellow' | 'green';
    reasons: string[];
    missing_information: string[];
    review_required: boolean;
    rules_version: string;
    assessed_at: string;
  };
  patientId: string;
  onNewPatient: () => void;
  onViewDetails: () => void;
  className?: string;
}

export function AssessmentResult({
  result,
  patientId,
  onNewPatient,
  onViewDetails,
  className = '',
}: AssessmentResultProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reducedMotion && containerRef.current) {
      animate(containerRef.current, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 400,
        easing: 'easeOutQuad',
      });
    }
  }, [reducedMotion]);

  return (
    <div ref={containerRef} className={`space-y-6 ${className}`} style={{ opacity: reducedMotion ? 1 : 0 }}>
      {/* Success header */}
      <div className="card p-5 bg-acuity-green/5 border-acuity-green/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-acuity-green/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-acuity-green" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-charcoal">{t('assessment.title')}</h2>
            <p className="text-secondary">{t('assessment.assessmentId')}: {result.assessment_id}</p>
          </div>
        </div>
      </div>

      {/* Acuity badge */}
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-secondary">{t('assessment.acuity')}</p>
            <AcuityBadge category={result.acuity} size="lg" />
          </div>
          <div className="flex items-center gap-4">
            <ReviewStatusBadge status={result.review_required ? 'pending' : 'not_required'} size="md" />
            {result.missing_information.length > 0 && (
              <span className="flex items-center gap-1 text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                {t('assessment.missingInformation')}: {result.missing_information.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Patient info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-secondary">{t('assessment.patientId')}</p>
          <p className="font-mono text-lg font-semibold text-charcoal">{patientId}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary">{t('assessment.assessmentId')}</p>
          <p className="font-mono text-lg font-semibold text-charcoal">{result.assessment_id}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary">{t('assessment.timestamp')}</p>
          <p className="font-medium text-charcoal">{formatTimeAgo(result.assessed_at, t)}</p>
        </div>
      </div>

      {/* Reasons */}
      {result.reasons.length > 0 && (
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-charcoal mb-3 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal" aria-hidden="true" />
            {t('assessment.reasons')}
          </h3>
          <ul className="space-y-2" role="list">
            {result.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-pale-blue rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal/10 flex items-center justify-center text-teal text-xs font-bold">
                  {index + 1}
                </span>
                <span className="text-charcoal">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing information */}
      {result.missing_information.length > 0 && (
        <div className="card p-5 border-yellow-200">
          <h3 className="text-lg font-semibold text-charcoal mb-3 flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            {t('assessment.missingInformation')}
          </h3>
          <ul className="space-y-2" role="list">
            {result.missing_information.map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-yellow-700">
                <span className="w-5 h-5 rounded-full border border-yellow-400 flex items-center justify-center text-xs font-bold text-yellow-600">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rules version */}
      <div className="card p-4 bg-background">
        <p className="text-sm text-secondary flex items-center gap-2">
          <FileText className="w-4 h-4" aria-hidden="true" />
          {t('assessment.rulesVersion')}: <span className="font-mono text-charcoal">{result.rules_version}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={onViewDetails}
          className="btn btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          {t('assessment.actions.viewDetails')}
        </button>
        <button
          onClick={onNewPatient}
          className="btn btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t('dashboard.newPatientAction').replace('+ ', '')}
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="btn btn-outline flex-1 sm:flex-none flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
          {t('assessment.actions.backToDashboard')}
        </button>
      </div>

      {/* Clinical disclaimer */}
      <div className="card p-4 border-teal/20 bg-teal/5" role="note">
        <p className="text-sm text-teal flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>{t('common.confirm')}: </strong>
            This is a decision-support prototype. Clinical judgment required. Not for diagnostic use.
          </span>
        </p>
      </div>
    </div>
  );
}