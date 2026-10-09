import { apiClient, formatApiError } from './apiClient';
import type {
  AssessmentCreateRequest,
  AssessmentResponse,
  ReassessmentRequest,
  AcknowledgementRequest,
  AcknowledgementResponse,
  AcuityCategory,
} from '../types/api';
import type { Translations } from '../i18n';

export interface AssessmentService {
  createAssessment(data: AssessmentCreateRequest, t: (key: string) => string): Promise<AssessmentResponse>;
  reassessPatient(data: ReassessmentRequest, t: (key: string) => string): Promise<AssessmentResponse>;
  acknowledgeAssessment(data: AcknowledgementRequest, t: (key: string) => string): Promise<AcknowledgementResponse>;
}

export const realAssessmentService: AssessmentService = {
  async createAssessment(data, t) {
    try {
      return await apiClient.post<AssessmentResponse>('/api/assessments', data);
    } catch (error) {
      throw new Error(formatApiError(error, t));
    }
  },

  async reassessPatient(data, t) {
    try {
      return await apiClient.post<AssessmentResponse>(`/api/patients/${data.patient_id}/reassess`, data);
    } catch (error) {
      throw new Error(formatApiError(error, t));
    }
  },

  async acknowledgeAssessment(data, t) {
    try {
      return await apiClient.post<AcknowledgementResponse>(`/api/assessments/${data.assessment_id}/acknowledge`, data);
    } catch (error) {
      throw new Error(formatApiError(error, t));
    }
  },
};

// Acuity display helpers
export const ACUITY_DISPLAY: Record<AcuityCategory, { label: string; color: string; bgColor: string }> = {
  red: {
    label: 'Red — High Acuity',
    color: '#D64545',
    bgColor: 'rgba(214, 69, 69, 0.1)',
  },
  yellow: {
    label: 'Yellow — Moderate Acuity',
    color: '#E3AE32',
    bgColor: 'rgba(227, 174, 50, 0.15)',
  },
  green: {
    label: 'Green — Low Acuity',
    color: '#269A69',
    bgColor: 'rgba(38, 154, 105, 0.1)',
  },
};

export function getAcuityDisplay(category: AcuityCategory | string, t: (key: string) => string): { label: string; color: string; bgColor: string } {
  const normalized = category.toLowerCase() as AcuityCategory;
  const display = ACUITY_DISPLAY[normalized] || {
    label: t('assessment.acuityLabels.unknown'),
    color: '#64717B',
    bgColor: 'rgba(100, 113, 123, 0.1)',
  };
  return {
    ...display,
    label: t(`assessment.acuityLabels.${normalized}` as keyof typeof import('../i18n/en').en.assessment.acuityLabels) || display.label,
  };
}

// Review status display
export type ReviewStatus = 'pending' | 'acknowledged' | 'not_required';

export function getReviewStatusDisplay(status: ReviewStatus, t: (key: string) => string): { label: string; color: string; bgColor: string } {
  switch (status) {
    case 'pending':
      return {
        label: t('assessment.reviewLabels.required'),
        color: '#E3AE32',
        bgColor: 'rgba(227, 174, 50, 0.15)',
      };
    case 'acknowledged':
      return {
        label: t('assessment.reviewLabels.acknowledged'),
        color: '#148F91',
        bgColor: 'rgba(20, 143, 145, 0.1)',
      };
    case 'not_required':
      return {
        label: t('assessment.reviewLabels.notRequired'),
        color: '#64717B',
        bgColor: 'rgba(100, 113, 123, 0.1)',
      };
    default:
      return {
        label: status,
        color: '#64717B',
        bgColor: 'rgba(100, 113, 123, 0.1)',
      };
  }
}

// Format time ago
export function formatTimeAgo(timestamp: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('common.justNow');
  if (diffMins < 60) return t('common.minutesAgo', { count: diffMins });
  if (diffHours < 24) return t('common.hoursAgo', { count: diffHours });
  return t('common.daysAgo', { count: diffDays });
}

// Format assessment reasons for display
export function formatReasons(reasons: string[], t: (key: string) => string): string {
  if (!reasons || reasons.length === 0) {
    return t('assessment.reasons') + ': ' + t('common.loading');
  }
  return reasons.map(r => `• ${r}`).join('\n');
}