import { FileText, Clock, AlertTriangle } from 'lucide-react';
import { AcuityBadge } from '../dashboard/AcuityBadge';
import type { AssessmentResponse } from '../../types/api';

interface AssessmentHistoryProps {
  assessments: AssessmentResponse[];
  formatTimeAgo: (timestamp: string) => string;
  getAcuityDisplay?: (category: string) => { label: string; color: string; bgColor: string };
  t: (key: string) => string;
}

export function AssessmentHistory({
  assessments,
  formatTimeAgo,
  t,
}: AssessmentHistoryProps) {
  if (assessments.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto text-secondary mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-charcoal mb-1">{t('patientDetails.history.empty')}</h3>
        <p className="text-secondary">No assessments have been performed for this patient yet.</p>
      </div>
    );
  }

  // Sort by date descending
  const sortedAssessments = [...assessments].sort(
    (a, b) => new Date(b.assessed_at).getTime() - new Date(a.assessed_at).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-charcoal">{t('patientDetails.history.title')}</h3>
        <span className="text-sm text-secondary">{assessments.length} {t('patientDetails.history.assessmentId')}</span>
      </div>

      <div className="space-y-3" role="list">
        {sortedAssessments.map((assessment) => (
          <article
            key={assessment.assessment_id}
            className="card p-4 hover:bg-pale-blue/50 transition-colors"
            role="listitem"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Assessment ID and date */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm font-medium text-charcoal">
                    {assessment.assessment_id}
                  </span>
                  <span className="text-sm text-secondary">
                    {formatTimeAgo(assessment.assessed_at)}
                  </span>
                  <AcuityBadge category={assessment.acuity} size="sm" />
                </div>
              </div>

              {/* Rules version */}
              <div className="flex items-center gap-4 text-sm text-secondary flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {t('patientDetails.history.rulesVersion')}: {assessment.rules_version}
                </span>
              </div>
            </div>

            {/* Reasons */}
            <div className="mt-3 pt-3 border-t border-border">
              <h4 className="text-sm font-medium text-charcoal mb-2">{t('patientDetails.history.reasons')}</h4>
              <ul className="space-y-1" role="list">
                {assessment.reasons.map((reason, i) => (
                  <li key={i} className="text-sm text-charcoal flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal/10 flex items-center justify-center text-teal text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {/* Missing info */}
            {assessment.missing_information.length > 0 && (
              <div className="mt-3 pt-3 border-t border-yellow-200">
                <div className="flex items-center gap-2 text-sm text-yellow-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium">{t('patientDetails.overview.missingInfo')}</span>
                </div>
                <ul className="mt-1 space-y-1" role="list">
                  {assessment.missing_information.map((item, i) => (
                    <li key={i} className="text-sm text-yellow-700 ml-6">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}